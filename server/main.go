package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"sync"
	"text/template"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type Game struct {
	lock      sync.Mutex
	state     GameState
	m         *Map
	listeners []*Listener
}

type Listener struct {
	player  string
	channel chan []byte
}

func (game *Game) addListener(player string, listener chan []byte) {
	game.lock.Lock()
	defer game.lock.Unlock()
	game.listeners = append(game.listeners, &Listener{player, listener})
}

func (game *Game) removeListener(listener chan []byte) {
	game.lock.Lock()
	defer game.lock.Unlock()
	for idx := range game.listeners {
		if game.listeners[idx].channel == listener {
			game.listeners[idx] = game.listeners[len(game.listeners)-1]
			game.listeners = game.listeners[:len(game.listeners)-1]
			break
		}
	}
}

func (game *Game) notifyListenersLocked(events []*Event) error {
	for idx := range game.listeners {
		for _, event := range events {
			data, err := json.Marshal(event.RedactForPlayer(game.listeners[idx].player))
			if err != nil {
				return err
			}
			game.listeners[idx].channel <- data
		}
	}
	return nil
}

type Context struct {
	lock  sync.Mutex
	games map[string]*Game
	maps  map[string]*Map
}

func (ctx *Context) findGame(id string) (*Game, bool) {
	ctx.lock.Lock()
	defer ctx.lock.Unlock()
	game, found := ctx.games[id]
	return game, found
}

func (ctx *Context) findMap(id string) (*Map, bool) {
	ctx.lock.Lock()
	defer ctx.lock.Unlock()
	m, found := ctx.maps[id]
	return m, found
}

var upgrader = websocket.Upgrader{}

func NewContext() Context {
	return Context{
		lock:  sync.Mutex{},
		games: make(map[string]*Game),
		maps:  make(map[string]*Map),
	}
}

func getUser(w http.ResponseWriter, r *http.Request) (string, bool) {
	cookie, err := r.Cookie("user")
	if err != nil || cookie.Value == "" {
		http.Redirect(w, r, fmt.Sprintf("/login?continue=%s", url.QueryEscape(r.URL.Path)), http.StatusFound)
		return "", false
	}
	return cookie.Value, true
}

//go:embed game.html
var gameTmplStr string
var gameTmpl = template.Must(template.New("game").Parse(gameTmplStr))

func staticGamePage(w http.ResponseWriter, r *http.Request) {
	user, found := getUser(w, r)
	if !found {
		return
	}

	type PageData struct {
		GameId   string
		PlayerId string
	}

	gameTmpl.Execute(w,
		&PageData{
			GameId:   mux.Vars(r)["gameId"],
			PlayerId: user,
		},
	)
}

//go:embed index.html
var indexTmplStr string
var indexTmpl = template.Must(template.New("index").Parse(indexTmplStr))

func getCreate(w http.ResponseWriter, r *http.Request) {
	_, found := getUser(w, r)
	if !found {
		return
	}
	indexTmpl.Execute(w, nil)
}

//go:embed login.html
var loginTmplStr string
var loginTmpl = template.Must(template.New("login").Parse(loginTmplStr))

func getLogin(w http.ResponseWriter, r *http.Request) {
	type PageData struct {
		Redirect string
	}
	loginTmpl.Execute(w,
		&PageData{
			Redirect: r.URL.Query().Get("continue"),
		},
	)
}

func postLogin(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	if username == "" {
		w.Write([]byte(`Error`))
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:  "user",
		Value: username,
	})
	redirect := r.URL.Query().Get("continue")
	if redirect != "" {
		http.Redirect(w, r, redirect, http.StatusFound)
	} else {
		http.Redirect(w, r, "/", http.StatusFound)
	}
}

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"

func RandStringBytes(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}

func (ctx *Context) createGame(w http.ResponseWriter, r *http.Request) {
	user, found := getUser(w, r)
	if !found {
		return
	}

	ctx.lock.Lock()
	defer ctx.lock.Unlock()
	var newGameId string
	for {
		newGameId = RandStringBytes(5)
		if _, collision := ctx.games[newGameId]; !collision {
			break
		}
	}

	state := NewGameState("hk")
	state.AddPlayer(user)
	ctx.games[newGameId] = &Game{
		lock:  sync.Mutex{},
		state: state,
		m:     ctx.maps["hk"],
	}

	http.Redirect(w, r, fmt.Sprintf("/game/%s", newGameId), http.StatusFound)
}

func (ctx *Context) getGame(w http.ResponseWriter, r *http.Request) {
	user, found := getUser(w, r)
	if !found {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	gameId := mux.Vars(r)["gameId"]
	game, found := ctx.findGame(gameId)
	if !found {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{ "error": "game not found" }`))
		return
	}
	game.lock.Lock()
	defer game.lock.Unlock()
	data, err := json.Marshal(game.state.RedactForPlayer(user))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{ "error": "bad game state" }`))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (ctx *Context) postGame(w http.ResponseWriter, r *http.Request) {
	user, found := getUser(w, r)
	if !found {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	gameId := mux.Vars(r)["gameId"]
	game, found := ctx.findGame(gameId)
	if !found {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{ "error": "game not found" }`))
		return
	}

	// Parse the request body before acquiring the game lock.
	var action Action
	err := json.NewDecoder(r.Body).Decode(&action)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf(`{ "error": "%s" }`, err.Error())))
		return
	}

	game.lock.Lock()
	defer game.lock.Unlock()
	events, err := game.state.ApplyAction(game.m, &action)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf(`{ "error": "%s" }`, err.Error())))
		return
	}
	if err := game.notifyListenersLocked(events); err != nil {
		log.Print("failed to notify listeners:", err)
	}
	var redactedEvents []*Event
	for _, event := range events {
		redactedEvents = append(redactedEvents, event.RedactForPlayer(user))
	}
	data, err := json.Marshal(redactedEvents)
	if err != nil {
		log.Print("failed to encode result:", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (ctx *Context) watchGame(w http.ResponseWriter, r *http.Request) {
	user, found := getUser(w, r)
	if !found {
		return
	}
	gameId := mux.Vars(r)["gameId"]
	game, found := ctx.findGame(gameId)
	if !found {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{ "error": "game not found" }`))
		return
	}
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade failed: ", err)
		return
	}
	defer c.Close()
	log.Printf("new watcher: game=%s", gameId)
	channel := make(chan []byte)
	game.addListener(user, channel)
	defer game.removeListener(channel)

	closeChan := make(chan error)
	go func() {
		_, _, err := c.ReadMessage()
		if err != nil {
			closeChan <- err
		} else {
			// Got a message, that is not acceptable.
			closeChan <- fmt.Errorf("client sent message, which is forbidden")
			c.Close()
		}
	}()

	for {
		select {
		case event := <-channel:
			err := c.WriteMessage(websocket.TextMessage, event)
			if err != nil {
				if _, ok := err.(*websocket.CloseError); ok {
					log.Print("watcher left")
				} else {
					log.Print("failed to send event: ", err)
				}
				return
			}

		case err := <-closeChan:
			if _, ok := err.(*websocket.CloseError); ok {
				log.Print("watcher left")
			} else {
				log.Print("connection unexpectedly closed: ", err)
			}
			return
		}
	}
}

func (ctx *Context) getMap(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	mapId := mux.Vars(r)["mapId"]
	m, found := ctx.findMap(mapId)
	if !found {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{ "error": "map not found" }`))
		return
	}
	data, err := json.Marshal(m)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{ "error": "bad map state" }`))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func main() {
	ctx := NewContext()
	ctx.maps["hk"] = NewTestMapHongKong()
	ctx.games["1"] = NewTestGameHongKong(ctx.maps["hk"])

	staticFs := http.FileServer(http.Dir("/Users/adamlesinski/workspace/map/static"))
	buildFs := http.FileServer(http.Dir("/Users/adamlesinski/workspace/map/dist"))
	srcFs := http.FileServer(http.Dir("/Users/adamlesinski/workspace/map/src"))

	r := mux.NewRouter()
	r.Handle("/index.css", staticFs)
	r.PathPrefix("/assets/").Handler(staticFs)
	r.PathPrefix("/dist/").Handler(http.StripPrefix("/dist", buildFs))
	r.PathPrefix("/src/").Handler(http.StripPrefix("/src", srcFs))

	r.HandleFunc("/", getCreate).Methods(http.MethodGet)
	r.HandleFunc("/create", ctx.createGame).Methods(http.MethodPost)
	r.HandleFunc("/login", getLogin).Methods(http.MethodGet)
	r.HandleFunc("/login", postLogin).Methods(http.MethodPost)
	r.HandleFunc("/game/{gameId}", staticGamePage).Methods(http.MethodGet)

	s := r.PathPrefix("/api/v1/").Subrouter()
	s.HandleFunc("/game/{gameId}", ctx.getGame).Methods(http.MethodGet)
	s.HandleFunc("/game/{gameId}", ctx.postGame).Methods(http.MethodPost)
	s.HandleFunc("/game/{gameId}/watch", ctx.watchGame).Methods(http.MethodGet)
	s.HandleFunc("/map/{mapId}", ctx.getMap).Methods(http.MethodGet)
	log.Fatal(http.ListenAndServe(":8080", r))
}

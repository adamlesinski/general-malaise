package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type Game struct {
	lock      sync.Mutex
	state     GameState
	m         *Map
	listeners []chan []byte
}

func (game *Game) addListener(listener chan []byte) {
	game.lock.Lock()
	defer game.lock.Unlock()
	game.listeners = append(game.listeners, listener)
}

func (game *Game) removeListener(listener chan []byte) {
	game.lock.Lock()
	defer game.lock.Unlock()
	for idx := range game.listeners {
		if game.listeners[idx] == listener {
			game.listeners[idx] = game.listeners[len(game.listeners)-1]
			game.listeners = game.listeners[:len(game.listeners)-1]
			break
		}
	}
}

func (game *Game) notifyListenersLocked(events []*Event) error {
	var event_bytes [][]byte
	for _, event := range events {
		data, err := json.Marshal(event)
		if err != nil {
			return err
		}
		event_bytes = append(event_bytes, data)
	}
	for idx := range game.listeners {
		for eventIdx := range event_bytes {
			game.listeners[idx] <- event_bytes[eventIdx]
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

func (ctx *Context) getGame(w http.ResponseWriter, r *http.Request) {
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
	data, err := json.Marshal(game.state)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{ "error": "bad game state" }`))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (ctx *Context) postGame(w http.ResponseWriter, r *http.Request) {
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
	data, err := json.Marshal(events)
	if err != nil {
		log.Print("failed to encode result:", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (ctx *Context) watchGame(w http.ResponseWriter, r *http.Request) {
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
		log.Print("upgrade failed:", err)
		return
	}
	defer c.Close()
	channel := make(chan []byte)
	game.addListener(channel)
	defer game.removeListener(channel)
	for event := range channel {
		err := c.WriteMessage(websocket.TextMessage, event)
		if err != nil {
			log.Print("failed to send event:", err)
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

func NewTestGame(m *Map) *Game {
	state := NewGameState("wahtever", []string{"wahtever", "hawflakes"})
	state.Territs["Arafan"] = &TerritoryMut{"hawflakes", 3}
	state.Territs["Moncton"] = &TerritoryMut{"hawflakes", 1}
	state.Territs["Creer"] = &TerritoryMut{"wahtever", 1}
	state.Start()
	return &Game{
		lock:      sync.Mutex{},
		state:     state,
		m:         m,
		listeners: make([]chan []byte, 0),
	}
}

func NewTestMap() *Map {
	m := &Map{
		AssetPath:    "/maps/alpha",
		AdjacencyMap: make(map[string][]string),
	}
	m.AdjacencyMap["Arafan"] = []string{"Moncton", "Creer"}
	m.AdjacencyMap["Moncton"] = []string{"Arafan", "Creer"}
	m.AdjacencyMap["Creer"] = []string{"Arafan", "Moncton"}
	return m
}

func main() {
	ctx := NewContext()
	m := NewTestMap()
	ctx.games["1"] = NewTestGame(m)
	ctx.maps["alpha"] = m

	fs := http.FileServer(http.Dir("/Users/adamlesinski/workspace/map/"))

	r := mux.NewRouter()
	r.Handle("/", fs)
	r.Handle("/index.css", fs)
	r.PathPrefix("/dist/").Handler(fs)

	s := r.PathPrefix("/api/v1/").Subrouter()
	s.HandleFunc("/game/{gameId}", ctx.getGame).Methods(http.MethodGet)
	s.HandleFunc("/game/{gameId}", ctx.postGame).Methods(http.MethodPost)
	s.HandleFunc("/game/{gameId}/watch", ctx.watchGame).Methods(http.MethodGet)
	s.HandleFunc("/map/{mapId}", ctx.getMap).Methods(http.MethodGet)
	log.Fatal(http.ListenAndServe(":8080", r))
}

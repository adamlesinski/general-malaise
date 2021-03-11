package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func home(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{ "message": "get called" }`))
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/", home).Methods(http.MethodGet)
	log.Fatal(http.ListenAndServe(":8080", r))
}

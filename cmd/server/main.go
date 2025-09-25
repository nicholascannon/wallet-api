package main

import (
	"fmt"
	"net/http"
)

func main() {
	server := createServer()
	if err := http.ListenAndServe(":8080", server); err != nil {
		fmt.Printf("Server failed: %s\n", err)
	}
}

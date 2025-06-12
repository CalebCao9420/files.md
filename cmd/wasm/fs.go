package main

import (
	"syscall/js"

	"github.com/spf13/afero"
)

func readFile(_ afero.Fs, path string) ([]byte, error) {
	resultChan := make(chan string, 1)
	errorChan := make(chan error, 1)

	callAsync("read", func(result js.Value, err error) {
		if err != nil {
			errorChan <- err
			return
		}
		resultChan <- result.String()
	}, path)

	select {
	case result := <-resultChan:
		sendToJS(result)
		return []byte(result), nil
	case err := <-errorChan:
		return nil, err
	}
}

func exists(_ afero.Fs, path string) (bool, error) {
	resultChan := make(chan bool, 1)
	errorChan := make(chan error, 1)

	callAsync("exists", func(result js.Value, err error) {
		if err != nil {
			errorChan <- err
			return
		}
		resultChan <- result.Bool()
	}, path)

	select {
	case result := <-resultChan:
		sendToJS(result)
		return result, nil
	case err := <-errorChan:
		return false, err
	}
}

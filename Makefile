run:
	go run ./cmd

test:
	go test ./...

install:
	go get ./...

check:
	go fmt ./... && go vet ./... && go test ./...
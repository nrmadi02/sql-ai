package sse

import (
	"bufio"
	"encoding/json"
	"fmt"
)

func Write(w *bufio.Writer, event string, data any) error {
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("marshal sse payload: %w", err)
	}

	if _, err := fmt.Fprintf(w, "event: %s\n", event); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(w, "data: %s\n\n", payload); err != nil {
		return err
	}
	return w.Flush()
}
package ai

import (
	"bufio"
	"io"
	"strings"
)

type StreamDeltaCallback func(delta string) error

func forEachSSEDataLine(reader *bufio.Reader, handle func(data string) (stop bool, err error)) error {
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}

		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, ":") {
			continue
		}

		if strings.HasPrefix(line, "event:") {
			continue
		}

		if !strings.HasPrefix(line, "data:") {
			continue
		}

		data := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if data == "" {
			continue
		}

		stop, err := handle(data)
		if err != nil {
			return err
		}
		if stop {
			return nil
		}
	}
}
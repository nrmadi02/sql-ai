package ai

import (
	"strings"
	"testing"
)

func TestReadOpenAIStream(t *testing.T) {
	t.Parallel()

	body := strings.NewReader(
		"data: {\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n" +
			"data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}]}\n\n" +
			"data: [DONE]\n\n",
	)

	var deltas []string
	content, usage, err := readOpenAIStream(body, func(delta string) error {
		deltas = append(deltas, delta)
		return nil
	})
	if err != nil {
		t.Fatalf("readOpenAIStream() error = %v", err)
	}

	if content != "Hello" {
		t.Fatalf("content = %q, want Hello", content)
	}
	if usage != nil {
		t.Fatalf("usage = %#v, want nil", usage)
	}
	if len(deltas) != 2 {
		t.Fatalf("deltas = %v", deltas)
	}
}

func TestReadOpenAIStreamUsage(t *testing.T) {
	t.Parallel()

	body := strings.NewReader(
		"data: {\"choices\":[{\"delta\":{\"content\":\"OK\"}}]}\n\n" +
			"data: {\"choices\":[],\"usage\":{\"prompt_tokens\":12,\"completion_tokens\":3,\"total_tokens\":15}}\n\n" +
			"data: [DONE]\n\n",
	)

	content, usage, err := readOpenAIStream(body, nil)
	if err != nil {
		t.Fatalf("readOpenAIStream() error = %v", err)
	}
	if content != "OK" {
		t.Fatalf("content = %q, want OK", content)
	}
	if usage == nil || usage.TotalTokens != 15 {
		t.Fatalf("usage = %#v, want total 15", usage)
	}
}

func TestReadAnthropicStream(t *testing.T) {
	t.Parallel()

	body := strings.NewReader(
		"event: content_block_delta\n" +
			"data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"Hi\"}}\n\n" +
			"event: message_stop\n" +
			"data: {\"type\":\"message_stop\"}\n\n",
	)

	content, usage, err := readAnthropicStream(body, nil)
	if err != nil {
		t.Fatalf("readAnthropicStream() error = %v", err)
	}
	if content != "Hi" {
		t.Fatalf("content = %q, want Hi", content)
	}
	if usage != nil {
		t.Fatalf("usage = %#v, want nil", usage)
	}
}

func TestReadAnthropicStreamUsage(t *testing.T) {
	t.Parallel()

	body := strings.NewReader(
		"data: {\"type\":\"message_start\",\"message\":{\"usage\":{\"input_tokens\":20}}}\n\n" +
			"data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"OK\"}}\n\n" +
			"data: {\"type\":\"message_delta\",\"usage\":{\"output_tokens\":5}}\n\n" +
			"data: {\"type\":\"message_stop\"}\n\n",
	)

	content, usage, err := readAnthropicStream(body, nil)
	if err != nil {
		t.Fatalf("readAnthropicStream() error = %v", err)
	}
	if content != "OK" {
		t.Fatalf("content = %q, want OK", content)
	}
	if usage == nil || usage.TotalTokens != 25 {
		t.Fatalf("usage = %#v, want total 25", usage)
	}
}
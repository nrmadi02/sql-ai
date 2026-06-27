package ai

import "testing"

func TestOpenAIChatCompletionsPath(t *testing.T) {
	tests := []struct {
		baseURL string
		want    string
	}{
		{"https://api.openai.com", "/v1/chat/completions"},
		{"https://api.groq.com/openai", "/v1/chat/completions"},
		{"http://localhost:11434", "/v1/chat/completions"},
		{"https://api.z.ai/api/paas/v4", "/chat/completions"},
		{"https://api.z.ai/api/coding/paas/v4", "/chat/completions"},
		{"https://api.z.ai/api/coding/paas/v4/", "/chat/completions"},
	}

	for _, tt := range tests {
		t.Run(tt.baseURL, func(t *testing.T) {
			if got := openAIChatCompletionsPath(tt.baseURL); got != tt.want {
				t.Fatalf("openAIChatCompletionsPath(%q) = %q, want %q", tt.baseURL, got, tt.want)
			}
		})
	}
}

func TestJoinURL(t *testing.T) {
	endpoint, err := joinURL("https://api.z.ai/api/coding/paas/v4", openAIChatCompletionsPath("https://api.z.ai/api/coding/paas/v4"))
	if err != nil {
		t.Fatalf("joinURL returned error: %v", err)
	}

	want := "https://api.z.ai/api/coding/paas/v4/chat/completions"
	if endpoint != want {
		t.Fatalf("endpoint = %q, want %q", endpoint, want)
	}
}

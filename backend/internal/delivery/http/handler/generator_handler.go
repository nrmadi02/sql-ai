package handler

import (
	"bufio"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/sse"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/domain/entity"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type GeneratorHandler struct {
	usecase *usecase.GeneratorUsecase
}

func NewGeneratorHandler(uc *usecase.GeneratorUsecase) *GeneratorHandler {
	return &GeneratorHandler{usecase: uc}
}

func (h *GeneratorHandler) CreateSession(c *fiber.Ctx) error {
	var req dto.CreateSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	session, err := h.usecase.CreateSession(c.Context(), usecase.CreateSessionInput{
		Title:        req.Title,
		DatasourceID: req.DatasourceID,
		AIProviderID: req.AIProviderID,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToGeneratorSessionResponse(session))
}

func (h *GeneratorHandler) ListSessions(c *fiber.Ctx) error {
	sessions, err := h.usecase.ListSessions(c.Context())
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToGeneratorSessionResponses(sessions))
}

func (h *GeneratorHandler) GetSessionByID(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	detail, err := h.usecase.GetSessionDetail(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSessionDetailResponse(detail.Session, detail.Messages))
}

func (h *GeneratorHandler) DeleteSession(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	if err := h.usecase.DeleteSession(c.Context(), id); err != nil {
		return mapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *GeneratorHandler) SendMessage(c *fiber.Ctx) error {
	sessionID, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	var req dto.SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	// Capture before SetBodyStreamWriter: c.Context() is nil inside the stream goroutine.
	reqCtx := c.Context()

	reqCtx.SetBodyStreamWriter(func(w *bufio.Writer) {
		write := func(event string, data any) error {
			return sse.Write(w, event, data)
		}

		streamErr := h.usecase.SendMessageStream(reqCtx, sessionID, usecase.SendMessageInput{
			Content:      req.Content,
			Tables:       req.Tables,
			DatasourceID: req.DatasourceID,
		}, func(event string, data any) error {
			switch event {
			case usecase.StreamEventUserMessage, usecase.StreamEventDone:
				message, ok := data.(*entity.GeneratorMessage)
				if !ok {
					return fiber.NewError(fiber.StatusInternalServerError, "invalid stream payload")
				}
				return write(event, dto.ToGeneratorMessageResponse(message))
			case usecase.StreamEventMeta:
				metadata, ok := data.(entity.AIMetadata)
				if !ok {
					return fiber.NewError(fiber.StatusInternalServerError, "invalid stream payload")
				}
				return write(event, dto.ToAIMetadataResponse(&metadata))
			default:
				return write(event, data)
			}
		})

		if streamErr != nil {
			_ = write(usecase.StreamEventError, dto.StreamErrorResponse{
				Message: streamErrorMessage(streamErr),
			})
		}
	})

	return nil
}

func streamErrorMessage(err error) string {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return "session not found"
	case errors.Is(err, domain.ErrInvalidInput):
		return "invalid input"
	case errors.Is(err, domain.ErrSchemaNotCached):
		return "schema not cached, sync required"
	case errors.Is(err, domain.ErrTableNotFound):
		return "table not found"
	case errors.Is(err, domain.ErrAIConnectionFailed):
		return err.Error()
	default:
		return "failed to generate response"
	}
}
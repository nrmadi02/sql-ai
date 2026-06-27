package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type SqlEditorHandler struct {
	usecase *usecase.SqlEditorUsecase
}

func NewSqlEditorHandler(uc *usecase.SqlEditorUsecase) *SqlEditorHandler {
	return &SqlEditorHandler{usecase: uc}
}

func (h *SqlEditorHandler) CreateSession(c *fiber.Ctx) error {
	var req dto.CreateSqlEditorSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	detail, err := h.usecase.CreateSession(c.Context(), usecase.CreateSqlEditorSessionInput{
		Name:         req.Name,
		DatasourceID: req.DatasourceID,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToSqlEditorSessionDetailResponse(detail))
}

func (h *SqlEditorHandler) ListSessions(c *fiber.Ctx) error {
	sessions, err := h.usecase.ListSessions(c.Context())
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSqlEditorSessionResponses(sessions))
}

func (h *SqlEditorHandler) GetSessionByID(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	detail, err := h.usecase.GetSessionByID(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSqlEditorSessionDetailResponse(detail))
}

func (h *SqlEditorHandler) UpdateSession(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	var req dto.UpdateSqlEditorSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	session, err := h.usecase.UpdateSession(c.Context(), id, usecase.UpdateSqlEditorSessionInput{
		Name:         req.Name,
		DatasourceID: req.DatasourceID,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSqlEditorSessionResponse(session))
}

func (h *SqlEditorHandler) DeleteSession(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	if err := h.usecase.DeleteSession(c.Context(), id); err != nil {
		return mapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *SqlEditorHandler) CreateTab(c *fiber.Ctx) error {
	sessionID, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	var req dto.CreateSqlEditorTabRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	tab, err := h.usecase.CreateTab(c.Context(), sessionID, usecase.CreateSqlEditorTabInput{
		Name:       req.Name,
		SQLContent: req.SQLContent,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToSqlEditorTabResponse(tab))
}

func (h *SqlEditorHandler) UpdateTab(c *fiber.Ctx) error {
	sessionID, err := parseUUIDParam(c, "sessionId")
	if err != nil {
		return err
	}

	tabID, err := parseUUIDParam(c, "tabId")
	if err != nil {
		return err
	}

	var req dto.UpdateSqlEditorTabRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	tab, err := h.usecase.UpdateTab(c.Context(), sessionID, tabID, usecase.UpdateSqlEditorTabInput{
		Name:       req.Name,
		SQLContent: req.SQLContent,
		SortOrder:  req.SortOrder,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSqlEditorTabResponse(tab))
}

func (h *SqlEditorHandler) DeleteTab(c *fiber.Ctx) error {
	sessionID, err := parseUUIDParam(c, "sessionId")
	if err != nil {
		return err
	}

	tabID, err := parseUUIDParam(c, "tabId")
	if err != nil {
		return err
	}

	if err := h.usecase.DeleteTab(c.Context(), sessionID, tabID); err != nil {
		return mapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *SqlEditorHandler) RunTab(c *fiber.Ctx) error {
	sessionID, err := parseUUIDParam(c, "sessionId")
	if err != nil {
		return err
	}

	tabID, err := parseUUIDParam(c, "tabId")
	if err != nil {
		return err
	}

	var req dto.RunSqlEditorTabRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	result, err := h.usecase.RunTab(c.Context(), sessionID, tabID, usecase.RunSqlEditorTabInput{
		MaxRows: req.MaxRows,
		SQL:     req.SQL,
	})
	if err != nil {
		return mapSqlEditorRunError(err)
	}

	return c.JSON(dto.ToQueryExecutionResponse(result))
}

func (h *SqlEditorHandler) GetAutocomplete(c *fiber.Ctx) error {
	datasourceID, err := parseUUIDParam(c, "datasourceId")
	if err != nil {
		return err
	}

	result, err := h.usecase.GetAutocomplete(c.Context(), datasourceID)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToAutocompleteResponse(result))
}

func mapSqlEditorRunError(err error) error {
	if errors.Is(err, domain.ErrQueryTimeout) {
		return fiber.NewError(fiber.StatusRequestTimeout, usecase.TranslateQueryError(err).Error())
	}

	var userErr *usecase.QueryUserError
	if errors.As(err, &userErr) {
		status := fiber.StatusBadRequest
		if errors.Is(userErr, domain.ErrQueryTimeout) {
			status = fiber.StatusRequestTimeout
		}
		return fiber.NewError(status, userErr.Error())
	}

	return mapDomainError(err)
}
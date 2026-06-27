package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type QueryHistoryHandler struct {
	usecase *usecase.QueryHistoryUsecase
}

func NewQueryHistoryHandler(uc *usecase.QueryHistoryUsecase) *QueryHistoryHandler {
	return &QueryHistoryHandler{usecase: uc}
}

func (h *QueryHistoryHandler) List(c *fiber.Ctx) error {
	input, err := parseListQueryHistoryInput(c)
	if err != nil {
		return err
	}

	page, err := h.usecase.List(c.Context(), input)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToQueryHistoryPageResponse(page))
}

func (h *QueryHistoryHandler) GetByID(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	entry, err := h.usecase.GetByID(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToQueryHistoryResponse(entry))
}

func parseListQueryHistoryInput(c *fiber.Ctx) (usecase.ListQueryHistoryInput, error) {
	input := usecase.ListQueryHistoryInput{}

	if raw := c.Query("datasource_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return input, fiber.NewError(fiber.StatusBadRequest, "invalid datasource_id")
		}
		input.DatasourceID = &id
	}

	input.Status = c.Query("status")
	input.Source = c.Query("source")

	if raw := c.Query("from_date"); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return input, fiber.NewError(fiber.StatusBadRequest, "invalid from_date")
		}
		input.FromDate = &parsed
	}

	if raw := c.Query("to_date"); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return input, fiber.NewError(fiber.StatusBadRequest, "invalid to_date")
		}
		input.ToDate = &parsed
	}

	if raw := c.Query("page"); raw != "" {
		page, err := strconv.Atoi(raw)
		if err != nil || page < 1 {
			return input, fiber.NewError(fiber.StatusBadRequest, "invalid page")
		}
		input.Page = page
	}

	if raw := c.Query("page_size"); raw != "" {
		pageSize, err := strconv.Atoi(raw)
		if err != nil || pageSize < 1 {
			return input, fiber.NewError(fiber.StatusBadRequest, "invalid page_size")
		}
		input.PageSize = pageSize
	}

	return input, nil
}
package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/domain/repository"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type ChartHandler struct {
	usecase *usecase.ChartUsecase
}

func NewChartHandler(uc *usecase.ChartUsecase) *ChartHandler {
	return &ChartHandler{usecase: uc}
}

func (h *ChartHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateChartConfigRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	config, err := h.usecase.Create(c.Context(), usecase.CreateChartConfigInput{
		SavedQueryID:       req.SavedQueryID,
		GeneratorMessageID: req.GeneratorMessageID,
		SqlEditorTabID:     req.SqlEditorTabID,
		ChartType:          req.ChartType,
		XAxisColumn:        req.XAxisColumn,
		YAxisColumns:       req.YAxisColumns,
		CategoryColumn:     req.CategoryColumn,
		Config:             req.Config,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToChartConfigResponse(config))
}

func (h *ChartHandler) List(c *fiber.Ctx) error {
	filter, err := parseChartListFilter(c)
	if err != nil {
		return err
	}

	items, err := h.usecase.List(c.Context(), filter)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToChartConfigResponses(items))
}

func (h *ChartHandler) GetByID(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	config, err := h.usecase.GetByID(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToChartConfigResponse(config))
}

func (h *ChartHandler) Update(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	var req dto.UpdateChartConfigRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	config, err := h.usecase.Update(c.Context(), id, usecase.UpdateChartConfigInput{
		ChartType:      req.ChartType,
		XAxisColumn:    req.XAxisColumn,
		YAxisColumns:   req.YAxisColumns,
		CategoryColumn: req.CategoryColumn,
		Config:         req.Config,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToChartConfigResponse(config))
}

func (h *ChartHandler) Suggest(c *fiber.Ctx) error {
	var req dto.ChartSuggestRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	columns := make([]usecase.QueryColumnResult, 0, len(req.Columns))
	for _, column := range req.Columns {
		columns = append(columns, usecase.QueryColumnResult{
			Name: column.Name,
			Type: column.Type,
		})
	}

	result, err := h.usecase.Suggest(usecase.ChartSuggestInput{
		Columns:  columns,
		Rows:     req.Rows,
		RowCount: req.RowCount,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToChartSuggestResponse(result))
}

func (h *ChartHandler) Delete(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	if err := h.usecase.Delete(c.Context(), id); err != nil {
		return mapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func parseChartListFilter(c *fiber.Ctx) (repository.ListChartConfigsFilter, error) {
	filter := repository.ListChartConfigsFilter{}

	if raw := c.Query("saved_query_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return filter, fiber.NewError(fiber.StatusBadRequest, "invalid saved_query_id")
		}
		filter.SavedQueryID = &id
	}

	if raw := c.Query("generator_message_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return filter, fiber.NewError(fiber.StatusBadRequest, "invalid generator_message_id")
		}
		filter.GeneratorMessageID = &id
	}

	if raw := c.Query("sql_editor_tab_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return filter, fiber.NewError(fiber.StatusBadRequest, "invalid sql_editor_tab_id")
		}
		filter.SqlEditorTabID = &id
	}

	return filter, nil
}
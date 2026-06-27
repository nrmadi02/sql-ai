package handler

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/domain"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type QueryHandler struct {
	usecase *usecase.QueryUsecase
}

func NewQueryHandler(uc *usecase.QueryUsecase) *QueryHandler {
	return &QueryHandler{usecase: uc}
}

func (h *QueryHandler) Execute(c *fiber.Ctx) error {
	var req dto.ExecuteQueryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	if req.DatasourceID.String() == "00000000-0000-0000-0000-000000000000" {
		return fiber.NewError(fiber.StatusBadRequest, "datasource_id is required")
	}

	result, err := h.usecase.Execute(c.Context(), usecase.ExecuteQueryInput{
		SQL:          req.SQL,
		DatasourceID: req.DatasourceID,
		MaxRows:      req.MaxRows,
		MessageID:    req.MessageID,
	})
	if err != nil {
		return mapQueryError(err)
	}

	return c.JSON(dto.ToQueryExecutionResponse(result))
}

func (h *QueryHandler) Explain(c *fiber.Ctx) error {
	var req dto.ExplainQueryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	if req.DatasourceID.String() == "00000000-0000-0000-0000-000000000000" {
		return fiber.NewError(fiber.StatusBadRequest, "datasource_id is required")
	}

	result, err := h.usecase.Explain(c.Context(), req.DatasourceID, req.SQL)
	if err != nil {
		return mapQueryError(err)
	}

	return c.JSON(dto.ToQueryExecutionResponse(result))
}

func mapQueryError(err error) error {
	if errors.Is(err, domain.ErrQueryTimeout) {
		return fiber.NewError(fiber.StatusRequestTimeout, usecase.TranslateQueryError(err).Error())
	}

	var userErr *usecase.QueryUserError
	if errors.As(err, &userErr) {
		status := fiber.StatusBadRequest
		if errors.Is(userErr, domain.ErrQueryTimeout) || errors.Is(userErr.Cause, context.DeadlineExceeded) {
			status = fiber.StatusRequestTimeout
		}
		return fiber.NewError(status, userErr.Error())
	}

	switch {
	case errors.Is(err, domain.ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, "Datasource tidak ditemukan.")
	default:
		return mapDomainError(err)
	}
}
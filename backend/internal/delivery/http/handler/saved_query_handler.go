package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type SavedQueryHandler struct {
	usecase *usecase.SavedQueryUsecase
}

func NewSavedQueryHandler(uc *usecase.SavedQueryUsecase) *SavedQueryHandler {
	return &SavedQueryHandler{usecase: uc}
}

func (h *SavedQueryHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateSavedQueryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	query, err := h.usecase.Create(c.Context(), usecase.CreateSavedQueryInput{
		Name:               req.Name,
		Description:        req.Description,
		SQLContent:         req.SQLContent,
		DatasourceID:       req.DatasourceID,
		Tags:               req.Tags,
		GeneratorMessageID: req.GeneratorMessageID,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToSavedQueryResponse(query))
}

func (h *SavedQueryHandler) List(c *fiber.Ctx) error {
	items, err := h.usecase.List(c.Context(), c.Query("search"), c.Query("tag"))
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSavedQueryResponses(items))
}

func (h *SavedQueryHandler) GetByID(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	query, err := h.usecase.GetByID(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSavedQueryResponse(query))
}

func (h *SavedQueryHandler) Update(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	var req dto.UpdateSavedQueryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	query, err := h.usecase.Update(c.Context(), id, usecase.UpdateSavedQueryInput{
		Name:         req.Name,
		Description:  req.Description,
		SQLContent:   req.SQLContent,
		DatasourceID: req.DatasourceID,
		Tags:         req.Tags,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToSavedQueryResponse(query))
}

func (h *SavedQueryHandler) Delete(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	if err := h.usecase.Delete(c.Context(), id); err != nil {
		return mapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/nrmadi02/sql-ai/internal/delivery/http/dto"
	"github.com/nrmadi02/sql-ai/internal/usecase"
)

type AIProviderHandler struct {
	usecase *usecase.AIProviderUsecase
}

func NewAIProviderHandler(uc *usecase.AIProviderUsecase) *AIProviderHandler {
	return &AIProviderHandler{usecase: uc}
}

func (h *AIProviderHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateAIProviderRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	provider, err := h.usecase.Create(c.Context(), usecase.CreateAIProviderInput{
		Name:      req.Name,
		APIFormat: req.APIFormat,
		BaseURL:   req.BaseURL,
		APIKey:    req.APIKey,
		Model:     req.Model,
		IsDefault: req.IsDefault,
		Config:    req.Config,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ToAIProviderResponse(provider))
}

func (h *AIProviderHandler) List(c *fiber.Ctx) error {
	items, err := h.usecase.List(c.Context())
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToAIProviderResponses(items))
}

func (h *AIProviderHandler) Update(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	var req dto.UpdateAIProviderRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	provider, err := h.usecase.Update(c.Context(), id, usecase.UpdateAIProviderInput{
		Name:      req.Name,
		APIFormat: req.APIFormat,
		BaseURL:   req.BaseURL,
		APIKey:    req.APIKey,
		Model:     req.Model,
		IsDefault: req.IsDefault,
		Config:    req.Config,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return c.JSON(dto.ToAIProviderResponse(provider))
}

func (h *AIProviderHandler) Delete(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	if err := h.usecase.Delete(c.Context(), id); err != nil {
		return mapDomainError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *AIProviderHandler) TestConnection(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}

	result, err := h.usecase.TestConnection(c.Context(), id)
	if err != nil {
		return mapDomainError(err)
	}

	return respondAITestConnection(c, result)
}

func (h *AIProviderHandler) TestConnectionWithBody(c *fiber.Ctx) error {
	var req dto.CreateAIProviderRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request format")
	}

	result, err := h.usecase.TestConnectionWithInput(c.Context(), usecase.CreateAIProviderInput{
		Name:      req.Name,
		APIFormat: req.APIFormat,
		BaseURL:   req.BaseURL,
		APIKey:    req.APIKey,
		Model:     req.Model,
		IsDefault: req.IsDefault,
		Config:    req.Config,
	})
	if err != nil {
		return mapDomainError(err)
	}

	return respondAITestConnection(c, result)
}

func respondAITestConnection(c *fiber.Ctx, result *usecase.TestAIProviderResult) error {
	status := fiber.StatusOK
	if !result.Success {
		status = fiber.StatusBadGateway
	}
	return c.Status(status).JSON(result)
}
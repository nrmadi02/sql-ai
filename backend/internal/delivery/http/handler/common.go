package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/nrmadi02/sql-ai/internal/domain"
)

func parseUUIDParam(c *fiber.Ctx, name string) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params(name))
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	return id, nil
}

func mapDomainError(err error) error {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	case errors.Is(err, domain.ErrInvalidInput):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrUnsupportedDBType):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrUnsupportedAPIFmt):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrSchemaNotCached):
		return fiber.NewError(fiber.StatusConflict, err.Error())
	case errors.Is(err, domain.ErrTableNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	case errors.Is(err, domain.ErrAIConnectionFailed):
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	case errors.Is(err, domain.ErrQueryForbidden):
		return fiber.NewError(fiber.StatusBadRequest, "Query mengandung perintah yang tidak diizinkan (misal DELETE, DROP, atau UPDATE). SQL AI hanya menjalankan query baca.")
	case errors.Is(err, domain.ErrQueryTimeout):
		return fiber.NewError(fiber.StatusRequestTimeout, "Query berjalan terlalu lama dan dibatalkan setelah 30 detik. Coba persempit rentang tanggal atau batasi jumlah baris.")
	case errors.Is(err, domain.ErrMultipleStatements):
		return fiber.NewError(fiber.StatusBadRequest, "Hanya satu pernyataan SQL yang boleh dijalankan dalam satu kali eksekusi.")
	default:
		return fiber.NewError(fiber.StatusInternalServerError, "internal server error")
	}
}
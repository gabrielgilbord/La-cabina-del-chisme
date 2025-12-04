-- Script para actualizar comentarios existentes y cambiar el default
-- Ejecuta esto si ya tienes comentarios en la base de datos

-- Aprobar todos los comentarios existentes
UPDATE comentarios 
SET aprobado = TRUE 
WHERE aprobado = FALSE;

-- Cambiar el default de la columna (si la tabla ya existe)
ALTER TABLE comentarios 
ALTER COLUMN aprobado SET DEFAULT TRUE;


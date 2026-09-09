-- integramente_flujos_interaccion_usuarios.md §6 punto 6: "Desactivación
-- (no eliminación) de cuentas... para preservar el historial de auditoría
-- intacto." Esto también corrige un bug real preexistente: mensajes.autor_id
-- y audit_log.autor_id referencian profiles(id) SIN "on delete cascade" ni
-- "on delete set null" — eliminar por completo una cuenta que alguna vez
-- envió un mensaje o generó una entrada de auditoría ya fallaba con una
-- violación de llave foránea antes de este cambio.
alter table public.profiles add column is_active boolean not null default true;

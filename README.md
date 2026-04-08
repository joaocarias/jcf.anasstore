# jcf.anasstore

## Checklist de segurança antes do deploy
1. Crie um `.env` baseado em `.env.example`.
2. Defina senhas fortes para `POSTGRES_PASSWORD` e `JwtSettings__SigningKey` (mín. 32 bytes).
3. Use `ASPNETCORE_ENVIRONMENT=Production` no deploy.
4. Garanta `Database__AutoMigrate=false` e `Seed__EnableDefaultUsers=false` em produção.
5. Confirme que `.env` e `appsettings.*.json` não estão versionados.

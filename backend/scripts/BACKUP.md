# Sauvegardes (base + uploads → Google Drive)

Sauvegarde quotidienne automatique de la base PostgreSQL et du dossier
`uploads`, envoyée hors-site sur Google Drive via **rclone**.

- Script : [`backup.sh`](./backup.sh)
- Planification : timer systemd `academypulaar-backup.timer` (tous les jours à 03h30), installé par le déploiement.
- Rétention : 7 jours en local (`/var/backups/academypulaar`), 30 jours sur Google Drive.

## Contenu d'une archive

Chaque sauvegarde est un fichier `academypulaar_AAAA-MM-JJ_HHMMSS.tar.gz` contenant :

- `db.dump` — dump PostgreSQL au format custom (`pg_dump -Fc`)
- `uploads.tar.gz` — archive du dossier `backend/uploads`

## Configuration unique de rclone (à faire une fois sur le VPS)

Le token Google Drive **n'est pas** stocké dans GitHub : il est créé une seule
fois sur le serveur. Le déploiement (`git reset --hard`) ne touche pas à
`~/.config`, donc cette configuration persiste entre les déploiements.

1. Se connecter au VPS **en tant qu'utilisateur `gha`** (celui qui exécute le timer) :

   ```bash
   sudo -u gha -i
   ```

2. Lancer la configuration interactive :

   ```bash
   rclone config
   ```

   - `n` (new remote)
   - name : **`gdrive`** (doit correspondre à `RCLONE_REMOTE` du script)
   - storage : `drive` (Google Drive)
   - `client_id` / `client_secret` : laisser vide (ou renseigner les vôtres pour de meilleurs quotas)
   - scope : `1` (accès complet) ou `drive.file`
   - laisser le reste par défaut

3. **Autorisation OAuth sur une machine avec navigateur** (le VPS est headless).
   Quand rclone demande `Use auto config?`, répondre **`n`**, puis sur votre
   ordinateur (avec rclone installé) :

   ```bash
   rclone authorize "drive"
   ```

   Coller le bloc de token retourné dans le terminal du VPS.

4. Vérifier :

   ```bash
   rclone listremotes              # doit afficher "gdrive:"
   rclone mkdir gdrive:academypulaar-backups
   rclone lsd gdrive:
   ```

Tant que le remote `gdrive` n'est pas configuré, le script effectue quand même
la **sauvegarde locale** et signale l'absence d'envoi hors-site (code de sortie 2,
visible via `systemctl status academypulaar-backup`).

## Lancer une sauvegarde manuelle

```bash
sudo -u gha bash /var/www/academypulaar/backend/scripts/backup.sh
```

## Vérifier la planification

```bash
systemctl status academypulaar-backup.timer
systemctl list-timers academypulaar-backup.timer
journalctl -u academypulaar-backup -n 50      # logs de la dernière exécution
```

## Restauration

1. Récupérer une archive (depuis Google Drive ou `/var/backups/academypulaar`) :

   ```bash
   rclone copy gdrive:academypulaar-backups/academypulaar_AAAA-MM-JJ_HHMMSS.tar.gz .
   ```

2. Extraire :

   ```bash
   mkdir restore && tar -xzf academypulaar_*.tar.gz -C restore && cd restore
   ```

3. Restaurer la base (⚠️ écrase les données existantes) :

   ```bash
   # DATABASE_URL est dans backend/.env
   pg_restore --clean --if-exists --no-owner \
     -d "postgresql://academypulaar:MOT_DE_PASSE@localhost:5432/academypulaar" \
     db.dump
   ```

4. Restaurer les uploads :

   ```bash
   tar -xzf uploads.tar.gz -C /var/www/academypulaar/backend/
   sudo /usr/local/bin/fix-academypulaar-uploads.sh   # remet les permissions
   ```

5. Redémarrer le backend :

   ```bash
   sudo systemctl restart academypulaar-api
   ```

## Variables d'environnement (overrides)

| Variable | Défaut | Rôle |
|----------|--------|------|
| `BACKUP_DIR` | `/var/backups/academypulaar` | Dossier des backups locaux |
| `UPLOADS_DIR` | `/var/www/academypulaar/backend/uploads` | Dossier à archiver |
| `ENV_FILE` | `/var/www/academypulaar/backend/.env` | Source de `DATABASE_URL` |
| `RCLONE_REMOTE` | `gdrive:academypulaar-backups` | Destination rclone |
| `RCLONE_CONFIG` | `~/.config/rclone/rclone.conf` | Config rclone |
| `LOCAL_RETENTION_DAYS` | `7` | Rétention locale |
| `REMOTE_RETENTION_DAYS` | `30` | Rétention Google Drive |

# Artifact "pista de enfriamiento"

Rediseño del command center donde los leads se ubican sobre el eje
2h → 24h → 72h → 7d → frío en vez de pestañas. **Vive fuera de la app**: es un
artifact estático en claude.ai, no una ruta de este repo. El panel de diario
sigue siendo `/admin/conversaciones`.

Los datos son una foto del momento en que se corrió el export — un artifact no
alcanza Firestore, así que para refrescarlo hay que volver a generarlo.

## Regenerar

```bash
gcloud auth application-default login   # sólo si las credenciales caducaron
node scripts/command-center-artifact/export.mjs
node scripts/command-center-artifact/build.mjs
```

Queda `command-center.html` aquí mismo; publícalo sobre la URL existente
(`https://claude.ai/code/artifact/909e07d8-2c38-4cc4-a139-a13c70596dbd`) para no
mintear un link nuevo.

`leads.json`, `corte.txt` y `command-center.html` son salidas: no se commitean.

## Tocar el diseño

Se edita `plantilla.html`, que es la página completa con dos huecos marcados
(`/*__LEADS__*/` y `/*__CORTE__*/`). El resto — colores, secciones, modo agenda —
está ahí tal cual se publica.

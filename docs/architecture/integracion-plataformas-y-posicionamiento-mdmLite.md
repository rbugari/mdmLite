# Integracion con plataformas y posicionamiento de MDM Lite

## Idea central
MDM Lite no pretende reemplazar plataformas de catalogo, gobierno o metadata management. Se posiciona como una capa operativa especializada para administrar reglas pequenas pero criticas que los procesos de datos deben consultar en tiempo de transformacion.

## Frente a Purview, Unity Catalog y catalogos similares

### Que hacen esas plataformas
1. Catalogan activos de datos.
2. Gestionan ownership y gobierno.
3. Exponen lineage, permisos y visibilidad transversal.
4. Ayudan al descubrimiento y a la administracion de metadata.

### Que hace MDM Lite
1. Administra equivalencias entre valores externos y valores canonicos.
2. Mantiene agrupaciones de negocio listas para ser consumidas por pipelines.
3. Publica parametros funcionales vigentes.
4. Expone contratos de lectura simples por vistas SQL.

## Con quien compite realmente
Los competidores reales suelen ser:

1. Excel compartido o archivos versionados manualmente.
2. Tablas auxiliares sin UI ni contrato estable.
3. Implementaciones RDM caseras dentro de pipelines.
4. Plataformas MDM enterprise sobredimensionadas para un problema puntual.

## Valor de la simplicidad
La simplicidad es parte del producto, no una carencia.

1. Reduce tiempo de adopcion.
2. Minimiza friccion con data engineering.
3. Hace mas clara la responsabilidad operativa.
4. Evita incorporar una plataforma mayor cuando el caso requiere una solucion acotada.

## Encaje en ETL clasico
En una arquitectura de DW tradicional, MDM Lite suele ubicarse entre el staging y la capa de integracion o negocio. Aporta homologacion y parametros antes de que los datos lleguen a marts o cubos.

## Encaje en ELT y medallion
En arquitecturas modernas, el mismo problema sigue existiendo.

### Bronze
Dato crudo, con minima intervencion.

### Silver
Capa natural para consumir MDM Lite. Aca se aplican equivalencias, agrupaciones y parametros.

### Gold
Salida curada para BI, semantic models y analitica. Recibe datos ya normalizados.

## Patrones por plataforma

### Databricks
MDM Lite puede publicar reglas en PostgreSQL y ser consumido por notebooks, jobs o modelos gobernados por Unity Catalog.

### Microsoft Fabric
Puede integrarse con dataflows, notebooks o pipelines para enriquecer datasets intermedios y curados.

### Snowflake
Encaja bien con ELT en SQL o dbt, aplicando reglas antes de marts o semantic layers.

## Recomendacion de integracion
1. Mantener el contrato tecnico en vistas activas.
2. Aplicar reglas en la capa intermedia, no al final del consumo.
3. Evitar replicar homologaciones dentro de cada modelo o notebook.
4. Tratar a MDM Lite como fuente estable de reference data operativa.
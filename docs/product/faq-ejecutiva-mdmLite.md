# FAQ ejecutiva MDM Lite

## Que problema resuelve?
MDM Lite resuelve un problema operativo recurrente: equivalencias, agrupaciones y parametros de negocio que suelen quedar dispersos entre Excel, tablas auxiliares y codigo repetido dentro de ETL o ELT.

## Es un MDM enterprise?
No. No busca resolver golden record, survivorship, workflow complejo, data stewardship extendido ni gobierno corporativo integral. Su foco es mas acotado: reference data y reglas funcionales simples listas para consumo tecnico.

## Compite con Purview, Unity Catalog o Collibra?
No de manera directa. Esas plataformas resuelven catalogo, gobierno, lineage, permisos, discovery y ownership. MDM Lite opera un nivel distinto: reglas concretas que los procesos de transformacion necesitan aplicar.

## Con quien compite de verdad?
Compite principalmente con:

1. Implementaciones caseras basadas en Excel, CSV y tablas sueltas.
2. Soluciones RDM ligeras construidas de forma ad hoc.
3. Plataformas MDM enterprise que resultan sobredimensionadas para el problema real.

## Cual es la propuesta de valor?
La propuesta de valor es simplicidad operativa con integracion tecnica clara:

1. UI minima para administrar reglas.
2. Vigencia y consistencia de lectura.
3. Contratos estables por vistas SQL.
4. Consumo simple desde SQL, Python, dbt, notebooks o pipelines.

## Donde encaja en arquitecturas modernas?
Encaja en ETL clasico, ELT, medallion y lakehouse. Su lugar natural suele ser la capa intermedia donde se homologan valores antes de publicar datasets curados, marts o semantic models.

## Como resumirlo en una frase?
MDM Lite es una capa operativa de reglas maestras simples que complementa al catalogo y al gobierno de datos con homologaciones, agrupaciones y parametros listos para consumo tecnico.
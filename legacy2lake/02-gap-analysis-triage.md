# Gap Analysis: Triage Actual vs Triage V2

## Objetivo

Definir el gap entre el Triage actual de Legacy2Lake, orientado a viabilidad de modernizacion, y un Triage V2 orientado a comprension profunda, decision downstream y reutilizacion del conocimiento.

## Resumen ejecutivo

El Triage actual responde razonablemente a preguntas del tipo:

- esto parece migrable o no
- que tecnologia contiene
- que gaps y riesgos aparecen
- que tipo de modernizacion conviene

Eso es util, pero insuficiente para el siguiente nivel de producto. Triage V2 debe responder tambien:

- que hace realmente la solucion
- que partes son funcionalmente criticas
- que conocimiento reusable contiene
- que downstreams conviene activar con este proyecto
- que partes requieren revision humana antes de cualquier generacion

## Triage actual: fortalezas detectadas

1. Deteccion de tecnologias y gaps.
2. Evaluacion de viabilidad inicial.
3. Construccion de mesh de modernizacion.
4. Identificacion inicial de entidades, dependencias y riesgos.
5. Buena preparacion para Agent C y la parte de generacion.

## Triage actual: limitaciones estructurales

### 1. Demasiado orientado a modernizacion y no suficiente a comprension

El Triage actual parece contestar bien `como modernizo esto`, pero no necesariamente `que sistema tengo delante`.

Riesgo:
Se acelera la generacion sin construir una memoria profunda del proyecto.

### 2. Tipado funcional todavia insuficiente

Hace falta distinguir mejor entre:

- logica de negocio reusable
- logica local de proyecto
- logica de soporte tecnico
- configuracion operacional
- activos puente o temporales
- activos publicados o finales

Riesgo:
Todo queda en una capa de razonamiento generalista, util para un agente, pero debil para downstreams mas exigentes.

### 3. Malla de modernizacion no equivale a modelo explicativo

El modernization mesh es una buena salida, pero no reemplaza un mapa estructurado de:

- procesos principales
- flujo funcional
- entidades centrales
- nodos criticos
- puntos de riesgo operativo
- dependencias contractuales

Riesgo:
Hay razonamiento para generar, pero no un gemelo logico suficientemente explicable.

### 4. Cobertura insuficiente de downstreams no generativos

Triage V2 debe decidir si el proyecto deberia producir ademas de codigo:

- metadata para catalogo
- knowledge pack explicativo
- candidatos de reglas para gobierno
- definiciones de orquestacion target
- candidatos a ownership, dominio o data product

Riesgo:
Toda la inteligencia de Triage termina sesgada hacia Agent C.

### 5. Manejo debil de incertidumbre estructurada

Triage no solo debe producir hallazgos; debe marcar:

- que sabe con alta certeza
- que infiere con probabilidad media
- que necesita confirmacion humana
- que no pudo determinar

Riesgo:
El downstream consume como certeza cosas que en realidad son inferencias blandas.

### 6. Falta de decision explicita sobre gobernabilidad de reglas

Aunque MDM no sea obligatorio, Triage deberia poder marcar:

- posible mapping reusable
- posible grouping reusable
- posible parameter reusable
- logica no apta para externalizacion

Riesgo:
La frontera entre logica local y conocimiento reusable queda invisible.

## Gap funcional

### Lo que Triage actual hace

- prioriza
- evalua
- clasifica migrabilidad
- detecta riesgos

### Lo que Triage V2 debe agregar

- explicar el funcionamiento profundo del proyecto
- decidir tipo de conocimiento encontrado
- habilitar downstreams multiples
- graduar certeza e incertidumbre
- etiquetar hallazgos por destino de uso

## Gap de datos

Triage V2 necesita construir o enriquecer entidades como:

- process_summary
- functional_capability
- entity_profile
- dependency_profile
- risk_signal
- uncertainty_marker
- downstream_recommendation
- rule_candidate_summary
- orchestration_profile

## Gap de testing

Triage V2 debe poder probarse por contratos, no solo por juicio semantico libre.

Ejemplos de validacion:

1. Cada hallazgo relevante trae evidencia.
2. Cada inferencia trae nivel de confianza.
3. Cada proyecto produce una recomendacion de downstream.
4. Cada riesgo esta vinculado a un asset o proceso.
5. Cada candidato reusable puede explicarse y revisarse.

## Resultado esperado de Triage V2

Triage debe convertirse en la capa que transforma el output bruto de Discovery en conocimiento util para decisiones reales.

Eso incluye decidir si el proyecto alimenta:

- generacion target
- catalogacion
- reglas gobernables
- documentacion explicativa
- redisenio de orquestacion

## Criterios de exito

1. Un humano puede leer el output de Triage y entender que hace la solucion sin abrir el codigo completo.
2. El sistema distingue entre hechos, inferencias y recomendaciones.
3. El sistema no asume que todo hallazgo deriva en generacion.
4. El sistema puede indicar `esto requiere revision humana` sin romper el flujo.
5. El output permite activar mas de un downstream por proyecto.

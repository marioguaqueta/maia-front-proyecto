# 🦅 Proyecto de Detección y Conteo Automático de Fauna

Este proyecto implementa un sistema de detección y conteo automatizado de fauna silvestre en imágenes aéreas utilizando la familia de modelos **YOLO** (Ultralytics). Incluye una pipeline completa de corrección de datos, entrenamiento con YOLO11, evaluación avanzada y una aplicación interactiva construida en **Streamlit**.

---

# 📌 Contenido del Proyecto
- Corrección y estandarización de anotaciones
- Conversión de formatos (Pascal VOC → YOLO)
- Entrenamiento y evaluación con YOLO11s
- Análisis de métricas de detección
- Aplicación interactiva con Streamlit
- Documentación técnica y preguntas de defensa académica

---

# 🖥️ ¿Qué es Streamlit?

**Streamlit** es un framework de Python que permite crear **aplicaciones web interactivas** sin necesidad de conocimientos avanzados en frontend. Es ampliamente utilizado por científicos de datos, analistas e ingenieros de machine learning para prototipado, visualización y despliegue de modelos.

### ✔️ ¿Para qué sirve?
- Dashboards interactivos
- Aplicaciones de ML/IA
- Manipulación de datos en tiempo real
- Interfaces amigables para pruebas de modelos

### ⭐ Cualidades destacadas
- Sintaxis simple (solo Python)
- Recarga automática al guardar cambios
- Widgets nativos (sliders, selects, botones)
- Integración directa con Pandas, NumPy, Torch, TensorFlow
- Despliegue rápido en la nube o servidores propios

---

# 🤖 ¿Qué es Ultralytics?

**Ultralytics** es la organización responsable de la familia de modelos YOLO. Su paquete oficial `ultralytics` provee una API simple, eficiente y rápida para:

- Entrenar modelos
- Realizar inferencias
- Revisar métricas y curvas
- Exportar modelos a múltiples formatos

Sus modelos están optimizados para GPU, obteniendo un excelente equilibrio entre rapidez y precisión.

---

# 🧠 ¿Qué es YOLO?

**YOLO (You Only Look Once)** es una familia de modelos *single-shot* para detección de objetos, conocida por ser:

- **Extremadamente rápida**  
- **Eficiente en uso de GPU**
- **Precisa en objetos pequeños**
- **Ideal para aplicaciones en tiempo real**

### ¿Cómo funciona?
YOLO divide la imagen en una grilla y predice simultáneamente:

- Localización de cajas (bounding boxes)
- Confianza de la detección
- Clase del objeto

Todo en un solo paso, lo que lo hace más rápido que métodos como R-CNN o Detectron2.

---

# 🔍 Parámetros de los modelos YOLO (familia YOLO11)

Ultralytics ofrece diferentes variantes según el compromiso **velocidad/peso/precisión**:

| Modelo | Tamaño aprox | Velocidad | Precisión | Uso recomendado |
|--------|--------------|-----------|-----------|-----------------|
| `yolo11n` | ~4.3M params | Muy rápida | Media | Edge devices, drones |
| `yolo11s` | ~9M params | Rápida | Alta | Uso general, producción ligera |
| `yolo11m` | ~25M params | Media | Muy alta | Proyectos con buena GPU |
| `yolo11l` | ~43M params | Lenta | Superior | Detección avanzada |
| `yolo11x` | ~75M params | Más lenta | Máxima | Investigación o alta precisión |

En este proyecto se utilizó **YOLO11s** por su excelente equilibrio entre velocidad y desempeño en objetos pequeños (crucial para fauna aérea).

---

# 📉 Funciones de Pérdida (Loss Functions) en YOLO

YOLO utiliza una combinación de *losses* que optimizan distintos aspectos del aprendizaje:

### **1. Bounding Box Regression Loss (bbox_loss)**
- Normalmente basada en **CIoU** o **SIoU**
- Mide qué tan bien coincide la caja predicha con la real
- Considera:
  - Distancia entre centros
  - Superposición (IoU)
  - Relación de aspecto

### **2. Classification Loss (cls_loss)**
- Basada en **Binary Cross Entropy (BCE)**  
- Evalúa si el modelo acierta la clase del objeto

### **3. DFL Loss (Distribution Focal Loss)**
- Introducida en YOLOv8 y mantenida en YOLO11  
- Permite una localización más precisa mediante distribución de bordes

### **4. Objectness Loss**
- Evalúa si realmente existe un objeto dentro de la predicción

### **¿Y Focal Loss?**
No se utilizó en este proyecto, pero es útil cuando hay fuerte desbalance de clases porque penaliza más los ejemplos difíciles.

---

# ⚙️ Optimizador Adam

El modelo se entrenó utilizando **Adam**, uno de los optimizadores más efectivos en visión por computadora.

### ¿Qué es Adam?
Adam (Adaptive Moment Estimation) combina las ventajas de:

- **Momentum** (acumula velocidad para evitar quedar atrapado en mínimos locales)
- **RMSProp** (ajusta la tasa de aprendizaje por parámetro)

### ¿Por qué es tan efectivo?
- Utiliza tasas de aprendizaje adaptativas  
- Maneja bien gradientes ruidosos  
- Converge más rápido que SGD en datasets complejos  
- Es muy estable en problemas de detección

### Hiperparámetros comunes:
- `lr = 0.001` (tasa de aprendizaje)
- `beta1 = 0.9` (promedio móvil del gradiente)
- `beta2 = 0.999` (promedio móvil del gradiente al cuadrado)
- `eps = 1e-8` (evita división por cero)

---

# ❓ Preguntas y Respuestas Técnicas (FAQ)

### **1. ¿Cómo garantizaron consistencia en la corrección de anotaciones?**
Mediante un script automatizado:
- Reindexación de clases (1–6 → 0–5)
- Conversión VOC → YOLO
- Validación de rangos y formatos  
Eliminamos variabilidad inter-anotador.

---

### **2. ¿Por qué no aplicar Focal Loss u oversampling?**
Limitación de tiempo.  
La corrección de anotaciones generó el mayor impacto inmediato (+61.4% mAP).

---

### **3. ¿Por qué YOLO11s y no Detectron2 u otros modelos YOLO?**
- +3.2% mAP en objetos pequeños vs YOLOv8  
- Inferencia más rápida que HerdNet  
- Eficiencia computacional ideal para despliegue

---

### **4. ¿Cómo mejorar especies poco representadas?**
- Focal Loss  
- Aumento de datos específico  
- GANs para síntesis  
- Recolección dirigida de imágenes  

---

### **5. ¿La resolución reducida afecta objetos pequeños?**
Sí.  
Se recomienda: **pipeline multi-escala → refinamiento en alta resolución**.

---

### **6. ¿Validación fuera de la Reserva Ennedi?**
No en esta fase.  
Se planea validar en Tanzania y Sudáfrica.

---

### **7. ¿Cómo evitar que el modelo aprenda el fondo?**
Aumentos de datos variados (brillo, rotación, mosaic).  
Aún así, requiere análisis de explicabilidad.

---

### **8. ¿Validación con biólogos en campo?**
No se realizó aún.  
Es un siguiente paso crítico.

---

### **9. ¿Cómo maneja oclusiones parciales?**
El modelo obtuvo 86.6% recall en manadas densas.  
Futuro: técnicas como **repulsion loss**.

---

### **10. ¿Qué es mejor con recursos limitados: mejorar modelo o mejorar datos?**
**Mejorar los datos.**  
La corrección de anotaciones aportó +61.4% mAP.

---

# 📂 Estructura del Repositorio


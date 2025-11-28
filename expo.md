# 🦅 Proyecto de Detección y Conteo Automático de Fauna

Este proyecto implementa un sistema de detección y conteo automatizado de fauna silvestre en imágenes aéreas utilizando modelos de visión por computadora basados en la familia **YOLO** (Ultralytics). Incluye una pipeline completa de corrección de datos, entrenamiento con YOLO11, evaluación y una aplicación interactiva construida con **Streamlit**.

---

## 📌 Contenido del Proyecto
- Corrección y estandarización de anotaciones
- Conversión de formatos Pascal VOC → YOLO
- Entrenamiento con YOLO11s
- Evaluación de desempeño
- Interfaz web interactiva con Streamlit
- Documentación técnica y preguntas frecuentes

---

# 🖥️ ¿Qué es Streamlit?

**Streamlit** es un framework de Python para crear **aplicaciones web interactivas** de forma rápida y sencilla, sin necesidad de escribir HTML, CSS ni JavaScript.

### ✔️ ¿Para qué sirve?
- Visualizar datos y gráficos.
- Desplegar modelos de IA y ML.
- Construir dashboards interactivos.
- Crear prototipos funcionales en minutos.

### ⭐ Cualidades destacadas
- Sintaxis extremadamente simple (solo Python).
- Widgets integrados (sliders, selects, formularios).
- Integración con Pandas, NumPy, PyTorch, TensorFlow, Matplotlib, Plotly y más.
- Recarga automática al guardar el archivo.
- Despliegue fácil en la nube o servidores propios.

En este proyecto se utiliza para visualizar detecciones, métricas y facilitar pruebas del modelo.

---

# 🤖 ¿Qué es Ultralytics?

**Ultralytics** es la organización creadora de la familia de modelos YOLO (You Only Look Once), que son los más utilizados en detección de objetos por su rapidez y precisión.

Su paquete oficial `ultralytics` permite:
- Entrenar modelos YOLO con pocas líneas de código.
- Correr inferencias rápidas.
- Revisar métricas y gráficas de entrenamiento.
- Exportar modelos a diferentes formatos.

### Ventajas principales
- API simple
- Modelos optimizados para GPU
- Comunidad activa y constante actualización
- Ideal para problemas de visión por computadora a gran escala

---

# 🧠 Uso de YOLO11

**YOLO11** es la última versión de los modelos YOLO, con mejoras significativas en precisión, especialmente en objetos pequeños, y mayor eficiencia computacional.

### ¿Por qué YOLO11s?
- Excelente balance entre velocidad y precisión.
- +3.2% mAP en objetos pequeños respecto a YOLOv8.
- Inferencia más rápida que otros modelos como HerdNet.
- Ideal para despliegue en escenarios reales con hardware limitado.

YOLO11s fue la opción más adecuada para detectar fauna en imágenes aéreas donde los animales ocupan pocos píxeles en la escena.

---

# ❓ Preguntas y Respuestas Técnicas (FAQ)

### **1. ¿Qué criterios usaron para la corrección de anotaciones y cómo garantizaron consistencia?**
Se automatizó el proceso mediante un script en Python que:
- Reindexó las clases (de 1–6 → 0–5)
- Convirtió coordenadas de Pascal VOC a YOLO
- Validó rangos, formatos y coherencia  
Esto eliminó variabilidad inter-anotador y garantizó consistencia.

---

### **2. ¿Por qué no implementaron Focal Loss u oversampling para el desbalanceo de clases?**
Por limitaciones de tiempo.  
La corrección de datos tuvo mayor impacto inmediato (+61.4% mAP), por lo que técnicas avanzadas de balanceo se dejan como trabajo futuro.

---

### **3. ¿Por qué YOLO11s y no Detectron2 u otras variantes de YOLO?**
YOLO11s demostró:
- Mejor precisión en objetos pequeños (+3.2% mAP vs YOLOv8)
- Mayor velocidad de inferencia
- Eficiencia para despliegue en campo  
Esto lo hizo ideal para el contexto del proyecto.

---

### **4. ¿Cómo mejorar especies poco representadas como jabalí o waterbuck?**
- Aplicar Focal Loss  
- Aumento de datos por especie  
- Generación sintética con GANs  
- Recolección dirigida de datos  

---

### **5. ¿La reducción de resolución afectó detección de individuos pequeños?**
Sí.  
Entrenar en 2048×2048 reduce información. Futuro: **pipeline multi-escala** (detección → refinamiento en alta resolución).

---

### **6. ¿Validaron generalización fuera de la Reserva Ennedi?**
No en esta fase.  
Se planea validar en Tanzania y Sudáfrica para evaluar transferibilidad.

---

### **7. ¿Cómo evitar correlaciones espurias del fondo?**
Se aplicaron aumentos como rotación, brillo, mosaic.  
Aun así, se recomienda incluir explicabilidad en siguientes fases.

---

### **8. ¿Realizaron validación con biólogos en campo?**
No en esta etapa.  
Es un paso crítico futuro para validar utilidad real en conservación.

---

### **9. ¿Cómo manejan oclusiones en manadas densas?**
El modelo mostró buen recall (86.6%).  
No se usaron técnicas especializadas como repulsion loss, pero se consideran para iteraciones futuras.

---

### **10. ¿Qué recomiendan priorizar con recursos limitados: mejorar modelo o mejorar datos?**
**Mejorar los datos.**  
La corrección de anotaciones aportó +61.4% mAP, superando cualquier cambio de arquitectura.

---

# 📂 Estructura sugerida del repositorio


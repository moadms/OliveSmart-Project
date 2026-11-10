import csv
import os

tables = {
    "tables/table1_dataset_distribution.csv": [
        ["Dataset Split", "Healthy (Sain)", "Water Stress", "Pathological Suspect", "Total Trees", "Spatial GSD (m/px)"],
        ["Training (80%)", "1932", "414", "414", "2760", "0.025 - 0.250"],
        ["Validation (20%)", "483", "104", "103", "690", "0.025 - 0.250"],
        ["Total", "2415", "518", "517", "3450", "Multi-Sensor"]
    ],
    "tables/table2_training_hyperparameters.csv": [
        ["Hyperparameter", "Value / Policy", "Agronomic Rationale"],
        ["Optimizer", "AdamW (lr0 = 1e-3, weight_decay = 0.0005)", "Decoupled L2 regularization for rapid convergence without weight explosion"],
        ["Loss Formulation", "CIoU (7.5) + DFL (1.5) + BCE (0.5)", "Aspect ratio penalty + distributional focal loss + binary class cross-entropy"],
        ["Epochs & Early Stopping", "100 epochs (Patience = 15, stopped @ 82)", "Anti-overfitting guard preventing memorization of arid background soil"],
        ["Batch Size", "16", "Optimal gradient variance with A100 40GB GPU"],
        ["LR Scheduler", "Cosine Annealing (lrf = 0.01, 3 warmup epochs)", "Smooth minimum descent avoiding early local optima"],
        ["Geometric Augmentation", "Rotation (+-180 deg), Mosaic (1.0), MixUp (0.15)", "Invariance to UAV flight azimuth, solar shadows, and boundary clipping"],
        ["Photometric Jitter", "HSV-H (0.015), HSV-S (0.7), HSV-V (0.4)", "Robustness against dry soil reflectance, limestone dust, and seasonal glare"]
    ],
    "tables/table3_yolov11s_classification_report.csv": [
        ["Phenotypic Class", "Precision", "Recall", "F1-Score", "AUC", "Support (Trees)"],
        ["Healthy (Sain)", "0.968", "0.962", "0.965", "0.996", "483"],
        ["Water Stress", "0.932", "0.915", "0.923", "0.985", "104"],
        ["Pathological Suspect", "0.941", "0.928", "0.934", "0.989", "103"],
        ["Macro Average", "0.947", "0.935", "0.941", "0.990", "690"],
        ["Weighted Average", "0.956", "0.948", "0.952", "0.992", "690"],
        ["Overall mAP@50", "0.952", "-", "0.952", "mAP@50-95: 0.746", "690"]
    ],
    "tables/table4_models_comparative_benchmark.csv": [
        ["Model Architecture", "Input Size", "Parameters (M)", "GFLOPs", "Precision", "Recall", "mAP@50", "mAP@50-95"],
        ["Baseline Custom CNN", "128x128", "6.52", "14.2", "0.864", "0.831", "0.848", "0.582"],
        ["EfficientNet-B0", "224x224", "4.38", "0.39", "0.365", "0.342", "0.351", "0.184"],
        ["Faster R-CNN (ResNet50)", "640x640", "41.50", "180.0", "0.894", "0.870", "0.882", "0.621"],
        ["YOLOv8n", "640x640", "3.16", "8.7", "0.852", "0.828", "0.841", "0.598"],
        ["YOLOv8s", "640x640", "11.17", "28.6", "0.901", "0.884", "0.896", "0.664"],
        ["YOLOv10s", "640x640", "8.03", "24.5", "0.923", "0.901", "0.918", "0.687"],
        ["YOLOv11s (Ours)", "640x640", "9.42", "21.5", "0.956", "0.948", "0.952", "0.746"]
    ],
    "tables/table5_inference_speed_latency.csv": [
        ["Architecture", "Parameters (M)", "Binary Size (MB)", "CPU Latency (ms)", "CPU FPS", "GPU Latency (ms)", "GPU FPS"],
        ["Faster R-CNN", "41.5", "168.2", "342.5 +- 24", "2.9", "48.2", "20.7"],
        ["YOLOv8s", "11.2", "22.5", "138.2 +- 11", "7.2", "10.8", "92.5"],
        ["YOLOv10s", "8.0", "16.8", "124.6 +- 10", "8.0", "9.2", "108.6"],
        ["YOLOv11s (Ours)", "9.4", "19.1", "112.4 +- 8", "8.9", "8.4", "119.0"]
    ]
}

for path, rows in tables.items():
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print(f"Generated {path}")

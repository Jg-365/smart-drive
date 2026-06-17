// SmartDrive ESP32 — fusão sensorial: média móvel do IMU + último GPS. JOA-TEC-02.
#pragma once

// Sobe a task de fusão (SD_FUSION_HZ). Empurra sd_fused_sample_t em sd_fused_queue.
void sensor_fusion_start(void);

#include "imu_reader.h"
#include "sd_config.h"
#include "sd_shared.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/i2c.h"
#include "esp_log.h"
#include "esp_timer.h"

static const char *TAG = "imu_reader";

// Registradores MPU6050
#define MPU_PWR_MGMT_1   0x6B
#define MPU_WHO_AM_I     0x75
#define MPU_ACCEL_XOUT_H 0x3B

// Fundos de escala padrão: accel ±2 g, gyro ±250 °/s
#define ACCEL_LSB_PER_G   16384.0f
#define GYRO_LSB_PER_DPS  131.0f

static esp_err_t mpu_write(uint8_t reg, uint8_t val) {
  uint8_t buf[2] = {reg, val};
  return i2c_master_write_to_device(SD_I2C_PORT, SD_MPU6050_ADDR, buf, 2,
                                    pdMS_TO_TICKS(100));
}

static esp_err_t mpu_read(uint8_t reg, uint8_t *dst, size_t len) {
  return i2c_master_write_read_device(SD_I2C_PORT, SD_MPU6050_ADDR, &reg, 1,
                                      dst, len, pdMS_TO_TICKS(100));
}

bool imu_reader_init(void) {
  const i2c_config_t conf = {
      .mode = I2C_MODE_MASTER,
      .sda_io_num = SD_I2C_SDA_GPIO,
      .scl_io_num = SD_I2C_SCL_GPIO,
      .sda_pullup_en = GPIO_PULLUP_ENABLE,
      .scl_pullup_en = GPIO_PULLUP_ENABLE,
      .master.clk_speed = SD_I2C_FREQ_HZ,
  };
  if (i2c_param_config(SD_I2C_PORT, &conf) != ESP_OK) return false;
  if (i2c_driver_install(SD_I2C_PORT, conf.mode, 0, 0, 0) != ESP_OK) return false;

  uint8_t who = 0;
  if (mpu_read(MPU_WHO_AM_I, &who, 1) != ESP_OK) {
    ESP_LOGE(TAG, "MPU6050 não respondeu no WHO_AM_I");
    return false;
  }
  ESP_LOGI(TAG, "MPU6050 WHO_AM_I=0x%02X", who);
  if (mpu_write(MPU_PWR_MGMT_1, 0x00) != ESP_OK) return false; // sai do sleep
  return true;
}

static int16_t be16(const uint8_t *p) { return (int16_t)((p[0] << 8) | p[1]); }

static void imu_task(void *arg) {
  (void)arg;
  const TickType_t period = pdMS_TO_TICKS(1000 / SD_IMU_HZ);
  TickType_t last = xTaskGetTickCount();
  uint8_t raw[14];

  for (;;) {
    if (mpu_read(MPU_ACCEL_XOUT_H, raw, sizeof(raw)) == ESP_OK) {
      sd_imu_sample_t s = {
          .accel_x = be16(&raw[0]) / ACCEL_LSB_PER_G,
          .accel_y = be16(&raw[2]) / ACCEL_LSB_PER_G,
          .accel_z = be16(&raw[4]) / ACCEL_LSB_PER_G,
          // raw[6..7] = temperatura (ignorada)
          .gyro_x = be16(&raw[8]) / GYRO_LSB_PER_DPS,
          .gyro_y = be16(&raw[10]) / GYRO_LSB_PER_DPS,
          .gyro_z = be16(&raw[12]) / GYRO_LSB_PER_DPS,
          .ts_ms = esp_timer_get_time() / 1000,
      };
      sd_shared_set_imu(&s);
    } else {
      ESP_LOGW(TAG, "falha na leitura do IMU");
    }
    vTaskDelayUntil(&last, period);
  }
}

void imu_reader_start(void) {
  xTaskCreate(imu_task, "imu_reader", 3072, NULL, 6, NULL);
}

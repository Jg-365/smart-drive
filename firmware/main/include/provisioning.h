// SmartDrive ESP32 — provisioning de Wi-Fi (SoftAP + captive portal + NVS).
// Substitui o SSID/senha hardcoded: na 1ª vez sobe um ponto de acesso
// "SmartDrive-Setup", o usuário escolhe a rede pelo celular e as credenciais
// ficam gravadas no NVS. JOA-RF B2.
#pragma once
#include <stdbool.h>
#include <stddef.h>

// Tamanhos máximos do padrão Wi-Fi (inclui o terminador '\0').
#define SD_PROV_SSID_MAXLEN 33
#define SD_PROV_PASS_MAXLEN 65

// Lê as credenciais salvas no NVS. Retorna true se existir um SSID gravado.
// ssid/pass devem apontar para buffers de SD_PROV_SSID_MAXLEN/SD_PROV_PASS_MAXLEN.
bool provisioning_get_credentials(char *ssid, char *pass);

// Apaga as credenciais do NVS (força o portal no próximo boot).
void provisioning_clear(void);

// Sobe o SoftAP + captive portal e BLOQUEIA até o usuário enviar uma rede.
// Após gravar no NVS, reinicia a placa (não retorna).
void provisioning_run_portal(void);

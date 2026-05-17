import { execFileSync } from "node:child_process";

const requiredVolumes = ["cms_mysql_data", "cms_minio_data"];

function volumeExists(volumeName) {
  try {
    execFileSync("docker", ["volume", "inspect", volumeName], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const missingVolumes = requiredVolumes.filter((volumeName) => !volumeExists(volumeName));

if (missingVolumes.length > 0) {
  console.error("");
  console.error("Volumes de dados obrigatorios nao encontrados:");
  for (const volumeName of missingVolumes) {
    console.error(`- ${volumeName}`);
  }
  console.error("");
  console.error("O dev usa volumes externos fixos para evitar criar um banco vazio sem querer.");
  console.error("Se esta for uma maquina nova e voce quer inicializar um banco local vazio, execute:");
  console.error("");
  console.error("  npm run dev:init-volumes");
  console.error("  npm run dev");
  console.error("");
  console.error("Se voce esperava dados existentes, pare agora e restaure/anexe o volume correto antes de subir.");
  console.error("");
  process.exit(1);
}

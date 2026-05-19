import { execFileSync } from "node:child_process";

const requiredVolumes = [
  "refresh-local-prod_mysql_localprod_data",
  "refresh-local-prod_minio_localprod_data"
];

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
  console.error("Volumes de dados obrigatorios do local-prod nao encontrados:");
  for (const volumeName of missingVolumes) {
    console.error(`- ${volumeName}`);
  }
  console.error("");
  console.error("O local-prod usa volumes externos fixos para evitar criar um banco vazio sem querer.");
  console.error("Se esta for uma maquina nova e voce quer inicializar um local-prod vazio, execute:");
  console.error("");
  console.error("  npm run local-prod:init-volumes");
  console.error("  npm run local-prod:up");
  console.error("");
  console.error("Se voce esperava dados existentes, pare agora e restaure/anexe o volume correto antes de subir.");
  console.error("");
  process.exit(1);
}

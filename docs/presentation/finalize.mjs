import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const skill=process.env.PRESENTATIONS_SKILL;
const python=process.env.ARTIFACT_PYTHON;
if(!skill || !python) throw new Error('Set PRESENTATIONS_SKILL and ARTIFACT_PYTHON from the bundled runtime.');
process.env.RUNTIME_NODE_MODULES ||= process.env.ARTIFACT_TOOL_MODULES;
await fs.mkdir(path.join(here,'output'),{recursive:true});
const { finalizePresentation } = await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
  explicitTotalSlideCount:14,
  requiredNativeTableOwnerSlides:[],
  requiredNativeChartOwnerSlides:[],
  workspaceDir:here,
  candidatePath:path.join(here,'.build/candidate.pptx'),
  finalPath:path.join(here,'output/TaskFlow-Karol-Scislowski.pptx'),
  pythonExecutable:python,
  integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
  fontPolicy:{basis:'design',families:['Arial']},
  verifyArtifactToolImport:true,
  receiptPath:path.join(here,'.build/validation.json'),
});
console.log(JSON.stringify(result));

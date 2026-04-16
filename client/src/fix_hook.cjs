const fs = require('fs/promises');
const path = require('path');

async function fix() {
  const p = path.join(process.cwd(), 'client/src/pages/wizards/WizardCore.tsx');
  let content = await fs.readFile(p, 'utf8');

  // Fix submission hook
  const strToFind = \`  const submission = useWizardSubmission({
    wizardType,
    draftKey: props.draftKey,
    clearStoredDraft,
    onSuccess: (data: any) => nav(\`/briefs/\${data.id}\`, { replace: true }),
    payloadBuilder: getSubmissionPayload,
    emit: telemetry.emit,
    getElapsedMs: telemetry.getElapsedMs,
  });\`;
  
  const strToFind2 = \`  const submission = useWizardSubmission({
    wizardType,
    draftKey: props.draftKey,
    clearStoredDraft,
    onSuccess: (data) => nav(\`/briefs/\${data.id}\`, { replace: true }),
    payloadBuilder: getSubmissionPayload,
    emit: telemetry.emit,
    getElapsedMs: telemetry.getElapsedMs,
  });\`;

  const strToReplace = \`  const submission = useWizardSubmission({
    wizardType,
    draftKey: props.draftKey,
    step,
    stepOrder: props.stepOrder,
    createIdempotencyKey: () => "auto-" + Date.now(),
    clearDraft: clearStoredDraft,
    navigateToKit: (kitId: string) => nav(\`/briefs/\${kitId}\`, { replace: true }),
    clampCounts: getSubmissionPayload,
    emit: telemetry.emit,
    getElapsedMs: telemetry.getElapsedMs,
  });\`;

  if (content.includes(strToFind)) {
    content = content.replace(strToFind, strToReplace);
  } else if (content.includes(strToFind2)) {
    content = content.replace(strToFind2, strToReplace);
  } else {
    // regex fallback
    content = content.replace(/const submission = useWizardSubmission\\([^)]*\\);/, strToReplace);
  }

  await fs.writeFile(p, content, 'utf8');
  console.log("Hook fixed");
}
fix().catch(console.error);

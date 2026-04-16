const fs = require('fs/promises');
const path = require('path');

async function fixFile() {
  const file = path.join(process.cwd(), 'client/src/pages/wizards/WizardCore.tsx');
  let content = await fs.readFile(file, 'utf8');

  // Regex string replacement is safer than split if whitespace varies
  
  const goodContent = `
    emit: telemetry.emit,
    getElapsedMs: telemetry.getElapsedMs,
  });
  const onValidSubmit = submission.onValidSubmit;
  const loading = submission.loading;
  const err = submission.error;

  useEffect(() => {
    if (!loading || reduceMotion) return;
    const id = window.setInterval(() => setTipIndex((i) => (i + 1) % WAITING_STAGES.length), 4500);
    return () => clearInterval(id);
  }, [loading, reduceMotion]);

  const currentStep = props.stepOrder[step]!;
  const isFinalStep = step === maxStep;

  return (
    <div className="mx-auto w-full max-w-6xl px-2 sm:px-4">
      <div className="mb-8 md:mb-10">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl">{props.title}</h2>
        <p className="mt-2 max-w-3xl text-on-surface-variant">{props.subtitle}</p>
      </div>

      {showDraftBanner && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tertiary/25 bg-tertiary/10 px-4 py-3 text-sm text-on-surface dark:border-brand-sand/40 dark:bg-brand-sand/10 dark:text-brand-darkText">
          <span>Restored a saved draft for this path.</span>
          <button type="button" className={btnSecondary + " py-2 text-sm"} onClick={clearDraft}>
            Clear draft
          </button>
        </div>
      )}

      <div className="wizard-root`;

  const fix1 = content.split('    getElapsedMs: telemetry.getElapsedMs,\n      )}\n\n      <div className="wizard-root');
  if (fix1.length === 2) {
    content = fix1[0] + goodContent.substring(goodContent.indexOf('    getElapsedMs: telemetry.getElapsedMs,')) + fix1[1];
    await fs.writeFile(file, content);
    console.log("Fixed with split 1!");
  } else {
    // If exact whitespace didn't match, try to find the start and end indices
    const startIdx = content.indexOf('    emit: telemetry.emit,\r\n    getElapsedMs: telemetry.getElapsedMs,\r\n      )}\r\n\r\n      <div className="wizard-root');
    const startIdx2 = content.indexOf('    emit: telemetry.emit,\n    getElapsedMs: telemetry.getElapsedMs,\n      )}\n\n      <div className="wizard-root');
    
    if (startIdx !== -1) {
      content = content.substring(0, startIdx) + goodContent.substring(goodContent.indexOf('    emit: telemetry.emit,')) + content.substring(startIdx + '    emit: telemetry.emit,\r\n    getElapsedMs: telemetry.getElapsedMs,\r\n      )}\r\n\r\n      <div className="wizard-root'.length);
      await fs.writeFile(file, content);
      console.log("Fixed with indexOf (CRLF)!");
      return;
    }
    
    if (startIdx2 !== -1) {
      content = content.substring(0, startIdx2) + goodContent.substring(goodContent.indexOf('    emit: telemetry.emit,')) + content.substring(startIdx2 + '    emit: telemetry.emit,\n    getElapsedMs: telemetry.getElapsedMs,\n      )}\n\n      <div className="wizard-root'.length);
      await fs.writeFile(file, content);
      console.log("Fixed with indexOf (LF)!");
      return;
    }
    console.log("no match found");
  }
}

fixFile().catch(console.error);

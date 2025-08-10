/* AI-HINT: Demo page to showcase the global loading UI by adding an artificial server delay. Frontend-only utility. */
import styles from './page.module.css';
export const dynamic = 'force-dynamic';

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default async function LoadingDemoPage() {
  // Artificial delay to let app/loading.tsx render visibly
  await wait(220000);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Global Loader Demo</h1>
        <p className={styles.subtitle}>You should have seen the premium loading animation before this content appeared.</p>
      </div>
    </main>
  );
}

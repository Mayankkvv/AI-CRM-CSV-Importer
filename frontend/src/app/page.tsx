export default function Home() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here is a summary of your recent AI imports.
        </p>
      </div>
      
      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-sm font-medium text-muted-foreground">Total CSVs Imported</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-sm font-medium text-muted-foreground">Rows Processed</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-sm font-medium text-muted-foreground">AI Mapping Accuracy</h3>
          <p className="text-3xl font-bold mt-2 text-primary">100%</p>
        </div>
      </div>

      {/* Main Content Area Placeholder */}
      <div className="rounded-xl border bg-card shadow-sm p-8 mt-4 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        </div>
        <h2 className="text-xl font-semibold">No Imports Yet</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          You haven't uploaded any data yet. Use the sidebar to navigate to the Importer and upload your first CSV.
        </p>
      </div>

    </div>
  );
}

import { Link } from "react-router-dom";

const AuthShell = ({ title, subtitle, children, footer }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-clay-50 text-ink-900">
      <div className="pointer-events-none absolute -left-40 top-[-120px] h-[420px] w-[420px] rounded-full bg-sunset-400/30 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-[120px] h-[380px] w-[380px] rounded-full bg-sea-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[15%] h-[340px] w-[340px] rounded-full bg-amber-200/60 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:px-10">
        <div className="lg:w-2/5">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.35em] text-ink-700/60"
          >
            MamNgon
          </Link>
          <h1 className="mt-6 font-display text-4xl leading-tight text-ink-900 md:text-5xl">
            Khoi phuc tai khoan nhanh chong.
          </h1>
          <p className="mt-4 max-w-md text-sm text-ink-700/70">
            Quy trinh lay lai mat khau ro rang, an toan va de theo doi tung
            buoc.
          </p>
        </div>

        <div className="lg:w-3/5">
          <div className="rounded-3xl border border-white/60 bg-white/85 p-8 shadow-float backdrop-blur lg:p-10">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sea-700">
                Ho tro dang nhap
              </p>
              <h2 className="font-display text-3xl text-ink-900 md:text-4xl">
                {title}
              </h2>
              <p className="text-sm text-ink-700/70">{subtitle}</p>
            </div>

            <div className="mt-8 space-y-6">{children}</div>

            {footer ? <div className="mt-8">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;

import LoginForm from "@/components/auth/LoginForm";
import { Cloud, Folder, ShieldCheck, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f5] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1320px] overflow-hidden rounded-[22px] bg-white shadow-[0_10px_45px_rgba(0,0,0,0.08)]">

        <section className="relative hidden w-[43%] overflow-hidden bg-[#101313] px-12 py-12 text-white lg:flex lg:flex-col">
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 top-36 h-[600px] w-[600px] rounded-full border border-emerald-400/10" />

            <div className="absolute -right-8 top-48 h-[500px] w-[500px] rounded-full border border-emerald-400/10" />

            <div className="absolute right-16 top-60 h-[400px] w-[400px] rounded-full border border-emerald-400/10" />

            <div className="absolute bottom-32 left-20 h-1.5 w-1.5 rounded-full bg-emerald-400/70" />

            <div className="absolute bottom-52 right-28 h-2 w-2 rounded-full bg-emerald-400/50" />

            <div className="absolute right-36 top-[55%] h-2 w-2 rounded-full bg-emerald-400/60" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-inner">
                <Folder
                  className="h-7 w-7 text-emerald-400"
                  strokeWidth={1.7}
                />
              </div>

              <span className="text-[21px] font-semibold tracking-tight">
                File <span className="text-emerald-400">Storage</span>
              </span>
            </div>

            {/* Heading */}
            <div className="mt-12">
              <h1 className="max-w-[480px] text-[38px] font-semibold leading-[1.18] tracking-[-1.5px]">
                Create your account
                <br />
                and <span className="text-emerald-400">get started</span>
              </h1>

              <p className="mt-5 max-w-[440px] text-[17px] leading-8 text-gray-400">
                Join us and securely store, manage, and
                <br />
                access your files from anywhere.
              </p>
            </div>

            {/* Features */}
            <div className="mt-8 space-y-5">
              {/* Secure */}
              <Feature
                icon={<ShieldCheck />}
                title="Secure & Private"
                description={
                  <>
                    Your files are encrypted and safe
                    <br />
                    with us.
                  </>
                }
              />

              {/* Access */}
              <Feature
                icon={<Cloud />}
                title="Access Anywhere"
                description={
                  <>
                    Access your files anytime,
                    <br />
                    anywhere, on any device.
                  </>
                }
              />

              {/* Collaboration */}
              <Feature
                icon={<Users />}
                title="Easy Collaboration"
                description={
                  <>
                    Share and collaborate with your
                    <br />
                    team effortlessly.
                  </>
                }
              />
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div className="w-full max-w-[650px]">
            {/* Header */}
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-[#111313] sm:text-4xl">
                Welcome 
     
              </h2>

              <p className="text-base text-gray-500 sm:text-lg">
                Login to your account to continue
              </p>
            </div>

            {/* Login Form */}
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-emerald-400">
        <div className="[&>svg]:h-6 [&>svg]:w-6">{icon}</div>
      </div>

      <div className="pt-0.5">
        <h3 className="text-[16px] font-semibold text-white">{title}</h3>

        <p className="mt-1 text-[14px] leading-6 text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

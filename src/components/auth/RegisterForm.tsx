"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  ArrowRight,
  Cloud,
  Eye,
  EyeOff,
  Folder,
  Lock,
  Mail,
  ShieldCheck,
  Upload,
  User,
  Users,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { RegisterFormData, registerSchema } from "@/schemas/auth.schema";

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = (await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      })) as { success?: boolean; message?: string };

      if (res.success) {
        toast.success("Account created successfully!");
        router.push("/login");
      } else {
        toast.error(res.message || "Unable to create account");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    }
  };

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
            <div className="absolute top-[55%] right-36 h-2 w-2 rounded-full bg-emerald-400/60" />
          </div>

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-inner">
              <Folder className="h-7 w-7 text-emerald-400" strokeWidth={1.7} />
            </div>

            <span className="text-[21px] font-semibold tracking-tight">
              File <span className="text-emerald-400">Storage</span>
            </span>
          </div>

          {/* Heading */}
          <div className="relative z-10 mt-12">
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
          <div className="relative z-10 mt-8 space-y-5">
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

        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div className="w-full max-w-[650px]">
            

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-3 block text-[16px] font-semibold text-[#111313]"
                >
                  Name
                </label>

                <div className="relative">
                  <User className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500" />

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    {...register("name")}
                    className={inputClass}
                  />
                </div>

                {errors.name && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-3 block text-[16px] font-semibold text-[#111313]"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500" />

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={inputClass}
                  />
                </div>

                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-3 block text-[16px] font-semibold text-[#111313]"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`${inputClass} pr-14`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-800"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[14px] text-gray-500">
                  <Lock className="h-4 w-4" />
                  <span>
                    Use at least 8 characters with a mix of letters, numbers &
                    symbols.
                  </span>
                </div>

                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[56px] w-full items-center justify-center gap-3 rounded-[9px] bg-[#171717] text-[17px] font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  "Creating account..."
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-5">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[15px] text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Login */}
            <p className="mt-9 text-center text-[16px] text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Login
              </Link>
            </p>
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


const inputClass =
  "h-[56px] w-full rounded-[10px] border border-gray-200 bg-white pl-14 pr-5 text-[17px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";


"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";

import { LoginResponse } from "@/types/auth";

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.token) {
        Cookies.set("accessToken", response.token, {
          expires: 7,
          secure: true,
          sameSite: "strict",
        });
      }

      if (response.user.role === "admin") {
        router.push("/dashboard/users");
      } else {
        router.push("/dashboard/uploads");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-3 block text-[16px] font-semibold text-[#111313]"
        >
          Email
        </label>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500" />

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            className="h-[56px] w-full rounded-[10px] border border-gray-200 bg-white pl-14 pr-5 text-[17px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {errors.email && (
          <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
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
          <Lock className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500" />
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

        {errors.password && (
          <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-[56px] w-full items-center justify-center gap-3 rounded-[9px] bg-[#171717] text-[17px] font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          "Logging in..."
        ) : (
          <>
            Login
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      {/* Register */}
      <p className="mt-9 text-center text-[16px] text-gray-500">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          Register
        </Link>
      </p>
    </form>
  );
}

const inputClass =
  "h-[56px] w-full rounded-[10px] border border-gray-200 bg-white pl-14 pr-5 text-[17px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";


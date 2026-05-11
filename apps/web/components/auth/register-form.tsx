'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterDto } from '@beauty-diary/shared';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Link, useRouter } from '@/i18n/navigation';
import { getApiErrorCode } from '@/lib/api';
import { useInitiateRegister, useResendRegisterOtp, useVerifyRegister } from '@/lib/queries/auth';
import { routes } from '@/lib/routes';

type FormValues = z.infer<typeof RegisterDto>;
const RESEND_COOLDOWN_S = 60;

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const initiate = useInitiateRegister();
  const verify = useVerifyRegister();
  const resend = useResendRegisterOtp();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(RegisterDto),
    defaultValues: { email: '', password: '', nickname: '' },
  });

  // Countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onDetailsSubmit = form.handleSubmit(async (values) => {
    try {
      await initiate.mutateAsync(values);
      setEmail(values.email);
      setStep('otp');
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'EMAIL_TAKEN') {
        form.setError('email', { message: t('errors.emailTaken') });
      } else if (code === 'NICKNAME_TAKEN') {
        form.setError('nickname', { message: t('errors.nicknameTaken') });
      } else {
        toast.error(t('errors.unknown'));
      }
    }
  });

  const onOtpSubmit = async (code: string) => {
    setOtpError(null);
    try {
      await verify.mutateAsync({ email, otp: code });
      router.push(routes.feed);
    } catch (err) {
      const apiCode = getApiErrorCode(err);
      if (apiCode === 'INVALID_OTP') {
        setOtpError(t('errors.invalidOtp'));
      } else if (apiCode === 'PENDING_REGISTRATION_NOT_FOUND') {
        setOtpError(t('errors.expiredOtp'));
      } else {
        setOtpError(t('errors.unknown'));
      }
      setOtp('');
    }
  };

  const onResend = async () => {
    try {
      await resend.mutateAsync({ email });
      setCooldown(RESEND_COOLDOWN_S);
      setOtpError(null);
      toast.success(t('otp.resendSuccess'));
    } catch (err) {
      const apiCode = getApiErrorCode(err);
      if (apiCode === 'OTP_RESEND_COOLDOWN') {
        setCooldown(RESEND_COOLDOWN_S);
      } else {
        toast.error(t('errors.unknown'));
      }
    }
  };

  if (step === 'otp') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-foreground-muted text-sm">
            {t.rich('otp.intro', {
              email: () => <span className="text-foreground font-medium">{email}</span>,
            })}
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setOtpError(null);
              if (v.length === 6) void onOtpSubmit(v);
            }}
            disabled={verify.isPending}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {otpError ? (
          <p className="text-destructive text-center text-sm">{otpError}</p>
        ) : verify.isPending ? (
          <p className="text-foreground-muted text-center text-sm">{t('otp.verifying')}</p>
        ) : null}

        <div className="space-y-2 text-center">
          <p className="text-foreground-muted text-sm">{t('otp.didntGetIt')}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={cooldown > 0 || resend.isPending}
          >
            {cooldown > 0 ? t('otp.resendIn', { seconds: cooldown }) : t('otp.resend')}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setStep('details');
            setOtp('');
            setOtpError(null);
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('otp.changeDetails')}
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={onDetailsSubmit} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nicknameLabel')}</FormLabel>
              <FormControl>
                <Input autoComplete="username" placeholder={t('nicknamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('passwordLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={initiate.isPending}>
          {initiate.isPending ? t('submitting') : t('submit')}
        </Button>

        <p className="text-foreground-muted text-center text-sm">
          {t('haveAccount')}{' '}
          <Link href={routes.login} className="text-primary font-medium hover:underline">
            {t('login')}
          </Link>
        </p>
      </form>
    </Form>
  );
}

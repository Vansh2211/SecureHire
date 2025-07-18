
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

// Preprocessing for optional number fields to handle empty strings
const emptyStringToUndefined = z.preprocess((val) => {
    if (typeof val === 'string' && val === '') return undefined;
    return val;
}, z.coerce.number().optional());

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Define Zod schema for validation
const formSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }).regex(/^\+?[0-9\s-]+$/, {message: "Invalid phone number format."}),
  role: z.string({ required_error: 'Please select a primary role.' }),
  experience: z.coerce.number().min(0, { message: 'Experience must be a positive number.' }),
  hourlyRate: emptyStringToUndefined,
  dailyRate: emptyStringToUndefined,
  monthlyRate: emptyStringToUndefined,
  bio: z.string().max(500, { message: 'Bio must not exceed 500 characters.' }).optional(),
  skills: z.string().optional(),
  location: z.string().min(2, { message: 'Location is required.' }),
  profilePicture: z
    .any()
    .refine((files) => files?.length === 1, 'Profile picture is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions.',
  }),
}).refine(data => data.hourlyRate != null || data.dailyRate != null || data.monthlyRate != null, {
    message: "Please provide at least one rate (hourly, daily, or monthly).",
    path: ["hourlyRate"], // Attach error to the first rate field for display
});

type FormData = z.infer<typeof formSchema>;

const roles = ["Security Guard", "Bouncer", "Event Security", "Bodyguard", "Caretaker"];

export default function RegisterGuardPage() {
  const { toast } = useToast();
  const { registerGuard } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      experience: 0,
      bio: '',
      skills: '',
      location: '',
      agreeTerms: false,
      profilePicture: undefined,
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    
    // Create a FormData object to send multipart data
    const formData = new FormData();
    
    // Append all form fields to the FormData object
    // The keys should match what your Spring Boot backend expects
    formData.append('fullName', values.fullName);
    formData.append('email', values.email);
    formData.append('password', values.password);
    formData.append('phone', values.phone);
    formData.append('role', values.role);
    formData.append('experience', values.experience.toString());
    formData.append('location', values.location);
    if (values.hourlyRate) formData.append('hourlyRate', values.hourlyRate.toString());
    if (values.dailyRate) formData.append('dailyRate', values.dailyRate.toString());
    if (values.monthlyRate) formData.append('monthlyRate', values.monthlyRate.toString());
    if (values.bio) formData.append('bio', values.bio);
    if (values.skills) formData.append('skills', values.skills);
    
    // Append the file
    if (values.profilePicture && values.profilePicture.length > 0) {
      formData.append('profilePicture', values.profilePicture[0]);
    }

    try {
      await registerGuard(formData);
      // AuthContext will handle redirect on success
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Could not create profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
           <div className="mb-4 flex justify-center">
              <UserPlus className="h-12 w-12 text-primary" />
           </div>
          <CardTitle className="text-3xl font-bold">Register as a Professional</CardTitle>
          <CardDescription>
            Join ProtectHire and start getting booked for security jobs. Fill out your profile below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Role</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your primary role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="e.g., 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Rates (₹)</FormLabel>
                <FormDescription>
                    Provide at least one rate. All fields are optional.
                </FormDescription>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-2">
                    <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-normal text-muted-foreground">Hourly</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" placeholder="e.g., 500" {...field} value={field.value ?? ""} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dailyRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-normal text-muted-foreground">Daily</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" placeholder="e.g., 4000" {...field} value={field.value ?? ""} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="monthlyRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-normal text-muted-foreground">Monthly</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" placeholder="e.g., 80000" {...field} value={field.value ?? ""} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                 <FormMessage>
                    {form.formState.errors.hourlyRate?.message}
                </FormMessage>
              </div>


               <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Service Area / City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mumbai, MH" {...field} />
                    </FormControl>
                     <FormDescription>
                        The main location where you are available for work.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications / Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PSARA License, CPR Certified, Crowd Control" {...field} />
                    </FormControl>
                     <FormDescription>
                        List any relevant skills, certifications or licenses you hold. Separate with commas.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell clients about yourself, your skills, and experience (max 500 characters)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                  control={form.control}
                  name="profilePicture"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Profile Picture</FormLabel>
                      <FormControl>
                        <Input
                          {...fieldProps}
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                           onChange={(event) => {
                                if (event.target.files) {
                                    onChange(event.target.files);
                                }
                            }}
                        />
                      </FormControl>
                      <FormDescription>
                        A clear, professional headshot is recommended. Max 5MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Agree to terms and conditions
                      </FormLabel>
                      <FormDescription>
                        You agree to our{' '}
                        <Link href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                          Privacy Policy
                        </Link>
                        .
                      </FormDescription>
                       <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" size="lg" disabled={isLoading}>
                 {isLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                 {isLoading ? 'Creating Profile...' : 'Register Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

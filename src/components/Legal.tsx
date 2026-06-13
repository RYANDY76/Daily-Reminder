import { ArrowLeft } from 'lucide-react'
import { useT } from '../i18n'
import { useAppStore } from '../stores/useAppStore'
import type { Lang } from '../types'

interface LegalPageProps {
  onBack: () => void
}

interface LegalSection {
  title: string
  body: string
  items?: string[]
}

const legalCopy: Record<Lang, {
  updatedLabel: string
  privacy: LegalSection[]
  terms: LegalSection[]
}> = {
  id: {
    updatedLabel: 'Terakhir diperbarui',
    privacy: [
      {
        title: '1. Informasi yang Kami Kumpulkan',
        body: 'Daily Reminder menyimpan data berikut secara lokal di perangkat Anda:',
        items: [
          'Nama profil dan foto jika login dengan Google',
          'Daftar tugas, jadwal, dan catatan',
          'Riwayat produktivitas harian',
          'Pengaturan aplikasi'
        ]
      },
      {
        title: '2. Penyimpanan Data',
        body: 'Data utama disimpan di browser atau perangkat Anda. Jika fitur cloud diaktifkan, data yang dipilih dapat disinkronkan ke Supabase sesuai akun yang digunakan.'
      },
      {
        title: '3. Akun Google',
        body: 'Jika Anda login dengan Google, aplikasi memakai nama, email, dan foto profil untuk membuat profil. Akses kalender hanya digunakan untuk fitur sinkronisasi yang Anda aktifkan.'
      },
      {
        title: '4. Notifikasi',
        body: 'Aplikasi dapat mengirim notifikasi untuk mengingatkan tugas. Anda dapat mematikan izin notifikasi kapan saja dari pengaturan aplikasi atau browser.'
      },
      {
        title: '5. Berbagi Data',
        body: 'Data tidak dijual atau disewakan. Fitur pasangan hanya membagikan data yang memang Anda hubungkan atau sinkronkan bersama pasangan.'
      },
      {
        title: '6. Hapus Data',
        body: 'Anda dapat menghapus data melalui Pengaturan > Cadangan dan pemulihan, menghapus profil, atau menghapus data browser/perangkat.'
      },
      {
        title: '7. Perubahan Kebijakan',
        body: 'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan disampaikan melalui aplikasi.'
      },
      {
        title: '8. Kontak',
        body: 'Jika ada pertanyaan, hubungi pengembang melalui kontak yang tersedia di aplikasi.'
      }
    ],
    terms: [
      {
        title: '1. Penerimaan',
        body: 'Dengan menggunakan Daily Reminder, Anda menyetujui syarat dan ketentuan ini.'
      },
      {
        title: '2. Penggunaan',
        body: 'Daily Reminder adalah aplikasi manajemen tugas pribadi. Anda bertanggung jawab atas data yang dimasukkan dan cara aplikasi digunakan.'
      },
      {
        title: '3. Akun dan PIN',
        body: 'Anda bertanggung jawab menjaga keamanan akun dan PIN. PIN yang lupa tidak dapat dipulihkan oleh aplikasi.'
      },
      {
        title: '4. Data',
        body: 'Data lokal bergantung pada penyimpanan perangkat. Cadangkan data secara berkala jika Anda mengandalkan aplikasi untuk jadwal penting.'
      },
      {
        title: '5. Layanan',
        body: 'Kami berusaha menjaga fitur tetap berjalan dengan baik, tetapi tidak menjamin layanan pihak ketiga seperti Google atau Supabase selalu tersedia.'
      },
      {
        title: '6. Perubahan',
        body: 'Syarat ini dapat berubah sewaktu-waktu. Penggunaan berkelanjutan berarti Anda menyetujui perubahan tersebut.'
      },
      {
        title: '7. Hukum',
        body: 'Syarat ini mengikuti hukum Republik Indonesia sejauh berlaku.'
      }
    ]
  },
  en: {
    updatedLabel: 'Last updated',
    privacy: [
      {
        title: '1. Information We Collect',
        body: 'Daily Reminder stores the following data locally on your device:',
        items: [
          'Profile name and photo when signing in with Google',
          'Tasks, schedules, and notes',
          'Daily productivity history',
          'App settings'
        ]
      },
      {
        title: '2. Data Storage',
        body: 'Core data is stored in your browser or device. If cloud features are enabled, selected data may sync to Supabase under the account you use.'
      },
      {
        title: '3. Google Account',
        body: 'When you sign in with Google, the app uses your name, email, and profile photo to create your profile. Calendar access is only used for sync features you enable.'
      },
      {
        title: '4. Notifications',
        body: 'The app may send notifications to remind you about tasks. You can disable notification permissions from the app or browser settings at any time.'
      },
      {
        title: '5. Data Sharing',
        body: 'Your data is not sold or rented. Partner features only share data that you connect or sync with your partner.'
      },
      {
        title: '6. Deleting Data',
        body: 'You can delete data from Settings > Backup and restore, by deleting a profile, or by clearing browser/device data.'
      },
      {
        title: '7. Policy Changes',
        body: 'This policy may be updated from time to time. Important changes will be communicated in the app.'
      },
      {
        title: '8. Contact',
        body: 'If you have questions, contact the developer through the contact details available in the app.'
      }
    ],
    terms: [
      {
        title: '1. Acceptance',
        body: 'By using Daily Reminder, you agree to these terms and conditions.'
      },
      {
        title: '2. Use',
        body: 'Daily Reminder is a personal task management app. You are responsible for the data you enter and how you use the app.'
      },
      {
        title: '3. Account and PIN',
        body: 'You are responsible for keeping your account and PIN secure. Forgotten PINs cannot be recovered by the app.'
      },
      {
        title: '4. Data',
        body: 'Local data depends on device storage. Back up your data regularly if you rely on the app for important schedules.'
      },
      {
        title: '5. Service',
        body: 'We try to keep features working well, but third-party services such as Google or Supabase may not always be available.'
      },
      {
        title: '6. Changes',
        body: 'These terms may change from time to time. Continued use means you accept the changes.'
      },
      {
        title: '7. Law',
        body: 'These terms follow the laws of the Republic of Indonesia where applicable.'
      }
    ]
  }
}

function LegalPage({
  title,
  sections,
  updatedLabel,
  onBack
}: {
  title: string
  sections: LegalSection[]
  updatedLabel: string
  onBack: () => void
}) {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const locale = lang === 'id' ? 'id-ID' : 'en-US'

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>
        <p className="text-xs text-gray-400 mb-6">
          {updatedLabel}: {new Date(2025, 0, 1).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">{section.title}</h2>
              <p>{section.body}</p>
              {section.items && (
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PrivacyPolicy({ onBack }: LegalPageProps) {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const copy = legalCopy[lang]

  return (
    <LegalPage
      title={t('settings.privacyPolicy')}
      sections={copy.privacy}
      updatedLabel={copy.updatedLabel}
      onBack={onBack}
    />
  )
}

export function TermsOfService({ onBack }: LegalPageProps) {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const copy = legalCopy[lang]

  return (
    <LegalPage
      title={t('settings.termsOfService')}
      sections={copy.terms}
      updatedLabel={copy.updatedLabel}
      onBack={onBack}
    />
  )
}

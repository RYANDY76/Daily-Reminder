Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   KREDENSIAL ROTATION CHECKLIST" -ForegroundColor Cyan
Write-Host "   Daily Reminder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$steps = @(
    @{ Status = "Pending"; Text = "Google Cloud Console → APIs & Services → Credentials → Delete/regenerate OAuth 2.0 Client ID yang bocor" },
    @{ Status = "Pending"; Text = "Buat Client ID baru dengan Authorized JavaScript origins (http://localhost:5173, https://your-domain.vercel.app)" },
    @{ Status = "Pending"; Text = "Update VITE_GOOGLE_CLIENT_ID di .env dengan Client ID baru" },
    @{ Status = "Pending"; Text = "Supabase Dashboard → Settings → API → Regenerate anon public key" },
    @{ Status = "Pending"; Text = "Update VITE_SUPABASE_ANON_KEY di .env" },
    @{ Status = "Pending"; Text = "Update VITE_SUPABASE_URL jika berubah" },
    @{ Status = "Pending"; Text = "Hapus file ZIP lama yang berisi kredensial bocor" },
    @{ Status = "Pending"; Text = "Jika kredensial sempat ter-commit: git filter-branch hapus dari history" },
    @{ Status = "Pending"; Text = "Regenerate .env dari .env.example" },
    @{ Status = "Pending"; Text = "Deploy ulang ke Vercel/Netlify dengan environment variable baru" }
)

for ($i = 0; $i -lt $steps.Count; $i++) {
    $num = $i + 1
    Write-Host "[$num/$($steps.Count)] " -NoNewline -ForegroundColor Yellow
    Write-Host $steps[$i].Text -ForegroundColor White
    $response = Read-Host "   Selesai? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $steps[$i].Status = "Done"
        Write-Host "   ✓ Done" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Skipped" -ForegroundColor Red
    }
    Write-Host ""
}

$done = ($steps | Where-Object { $_.Status -eq "Done" }).Count
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Selesai: $done/$($steps.Count) langkah" -ForegroundColor $(if ($done -eq $steps.Count) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan

pause

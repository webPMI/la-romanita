Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-GitRepo {
    & git rev-parse --is-inside-work-tree *> $null
    return ($LASTEXITCODE -eq 0)
}

function Get-Branch {
    return ((& git rev-parse --abbrev-ref HEAD).Trim())
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args,
        [switch]$AllowFail
    )

    & git @Args
    if (-not $AllowFail -and $LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Args -join ' ')"
    }
}

function Pause-Menu {
    Write-Host ""
    Read-Host "Pulsa Enter para volver al menu" | Out-Null
}

function Confirm-Action {
    param([string]$Message)
    $answer = Read-Host "$Message (y/N)"
    return ($answer -eq "y" -or $answer -eq "Y")
}

function Get-OriginWebUrl {
    $origin = (& git remote get-url origin).Trim()

    if ($origin -match "^git@github.com:(.+?)\.git$") {
        return "https://github.com/$($Matches[1])"
    }

    if ($origin -match "^https://github.com/(.+?)\.git$") {
        return "https://github.com/$($Matches[1])"
    }

    if ($origin -match "^https://github.com/(.+?)$") {
        return $origin
    }

    return $null
}

function Show-Menu {
    Clear-Host
    Write-Host "==========================================="
    Write-Host "  GitHub Quick Console - la-romanita"
    Write-Host "==========================================="
    Write-Host "1.  Estado rapido (status + branch)"
    Write-Host "2.  Fetch --all --prune y comparacion"
    Write-Host "3.  Pull --rebase de la rama actual"
    Write-Host "4.  Push de la rama actual"
    Write-Host "5.  Add + Commit + Push rapido"
    Write-Host "6.  Crear feature branch desde main"
    Write-Host "7.  Volver a main y sincronizar"
    Write-Host "8.  Listar ramas locales con ultimo commit"
    Write-Host "9.  Borrar ramas locales mergeadas en main"
    Write-Host "10. Crear stash y listar stashes"
    Write-Host "11. Aplicar stash mas reciente (pop)"
    Write-Host "12. Ver log grafico (20 commits)"
    Write-Host "13. Abrir repo en GitHub (navegador)"
    Write-Host "14. Crear Pull Request con gh"
    Write-Host "15. Salir"
    Write-Host ""
}

if (-not (Test-GitRepo)) {
    Write-Host "No estas dentro de un repositorio Git." -ForegroundColor Red
    exit 1
}

while ($true) {
    try {
        Show-Menu
        $choice = Read-Host "Elige una opcion (1-15)"

        switch ($choice) {
            "1" {
                Write-Host "\nRama actual: $(Get-Branch)" -ForegroundColor Cyan
                Invoke-Git -Args @("status", "-sb")
                Pause-Menu
            }

            "2" {
                Invoke-Git -Args @("fetch", "--all", "--prune")
                Invoke-Git -Args @("status", "-sb")
                Pause-Menu
            }

            "3" {
                $branch = Get-Branch
                Invoke-Git -Args @("pull", "--rebase", "origin", $branch)
                Pause-Menu
            }

            "4" {
                $branch = Get-Branch
                & git rev-parse --abbrev-ref --symbolic-full-name "@{u}" *> $null
                if ($LASTEXITCODE -eq 0) {
                    Invoke-Git -Args @("push")
                }
                else {
                    Invoke-Git -Args @("push", "-u", "origin", $branch)
                }
                Pause-Menu
            }

            "5" {
                Invoke-Git -Args @("status", "-sb")
                $msg = Read-Host "Mensaje de commit"
                if ([string]::IsNullOrWhiteSpace($msg)) {
                    Write-Host "Commit cancelado: mensaje vacio." -ForegroundColor Yellow
                }
                else {
                    Invoke-Git -Args @("add", "-A")
                    Invoke-Git -Args @("commit", "-m", $msg)
                    $branch = Get-Branch
                    & git rev-parse --abbrev-ref --symbolic-full-name "@{u}" *> $null
                    if ($LASTEXITCODE -eq 0) {
                        Invoke-Git -Args @("push")
                    }
                    else {
                        Invoke-Git -Args @("push", "-u", "origin", $branch)
                    }
                }
                Pause-Menu
            }

            "6" {
                $name = Read-Host "Nombre de feature (sin prefijo feature/)"
                if ([string]::IsNullOrWhiteSpace($name)) {
                    Write-Host "Nombre invalido." -ForegroundColor Yellow
                }
                else {
                    $newBranch = "feature/$name"
                    Invoke-Git -Args @("checkout", "main")
                    Invoke-Git -Args @("pull", "--rebase", "origin", "main")
                    Invoke-Git -Args @("checkout", "-b", $newBranch)
                }
                Pause-Menu
            }

            "7" {
                Invoke-Git -Args @("fetch", "--all", "--prune")
                Invoke-Git -Args @("checkout", "main")
                Invoke-Git -Args @("pull", "--rebase", "origin", "main")
                Pause-Menu
            }

            "8" {
                Invoke-Git -Args @("branch", "--sort=-committerdate", "--format=%(refname:short) | %(committerdate:relative) | %(subject)")
                Pause-Menu
            }

            "9" {
                Invoke-Git -Args @("checkout", "main")
                Invoke-Git -Args @("pull", "--rebase", "origin", "main")
                $current = Get-Branch
                $merged = (& git branch --merged main) |
                    ForEach-Object { $_.Trim().TrimStart("*").Trim() } |
                    Where-Object {
                        $_ -and $_ -ne "main" -and $_ -ne "master" -and $_ -ne "develop" -and $_ -ne $current
                    }

                if (-not $merged -or $merged.Count -eq 0) {
                    Write-Host "No hay ramas locales mergeadas para borrar." -ForegroundColor Yellow
                }
                else {
                    Write-Host "Ramas que se pueden borrar:"
                    $merged | ForEach-Object { Write-Host " - $_" }

                    if (Confirm-Action -Message "Quieres borrarlas ahora") {
                        foreach ($b in $merged) {
                            Invoke-Git -Args @("branch", "-d", $b)
                        }
                    }
                }
                Pause-Menu
            }

            "10" {
                $stashMsg = Read-Host "Mensaje del stash (opcional)"
                if ([string]::IsNullOrWhiteSpace($stashMsg)) {
                    $stashMsg = "quick-stash $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
                }
                Invoke-Git -Args @("stash", "push", "-u", "-m", $stashMsg)
                Invoke-Git -Args @("stash", "list")
                Pause-Menu
            }

            "11" {
                Invoke-Git -Args @("stash", "list")
                if (Confirm-Action -Message "Aplicar stash@{0} con pop") {
                    Invoke-Git -Args @("stash", "pop")
                }
                Pause-Menu
            }

            "12" {
                Invoke-Git -Args @("log", "--graph", "--oneline", "--decorate", "-n", "20")
                Pause-Menu
            }

            "13" {
                $url = Get-OriginWebUrl
                if ($null -eq $url) {
                    Write-Host "No pude resolver una URL web para origin." -ForegroundColor Yellow
                }
                else {
                    Start-Process $url
                    Write-Host "Abierto en navegador: $url" -ForegroundColor Green
                }
                Pause-Menu
            }

            "14" {
                & gh --version *> $null
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "GitHub CLI (gh) no esta instalado o no esta en PATH." -ForegroundColor Yellow
                }
                else {
                    $base = Read-Host "Base branch para PR (default: main)"
                    if ([string]::IsNullOrWhiteSpace($base)) {
                        $base = "main"
                    }
                    Invoke-Git -Args @("push") -AllowFail
                    & gh pr create --fill --base $base
                }
                Pause-Menu
            }

            "15" {
                Write-Host "Hasta luego."
                break
            }

            default {
                Write-Host "Opcion invalida." -ForegroundColor Yellow
                Pause-Menu
            }
        }
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Pause-Menu
    }
}

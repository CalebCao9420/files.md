use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;

#[derive(Clone, Copy)]
enum UpdatePrompt {
    /// Startup: only prompt when a newer version exists.
    OnAvailable,
    /// Tray menu: also confirm when already up to date.
    AlwaysNotify,
}

pub fn schedule_startup_check(app: &AppHandle) {
    if cfg!(debug_assertions) {
        return;
    }

    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        std::thread::sleep(std::time::Duration::from_secs(4));
        if let Err(err) = check_for_updates(app, UpdatePrompt::OnAvailable).await {
            eprintln!("md-toolkit updater: {err}");
        }
    });
}

pub fn check_updates_from_tray(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(err) = check_for_updates(app, UpdatePrompt::AlwaysNotify).await {
            eprintln!("md-toolkit updater: {err}");
        }
    });
}

async fn check_for_updates(app: AppHandle, prompt: UpdatePrompt) -> Result<(), String> {
    let Some(update) = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?
    else {
        if matches!(prompt, UpdatePrompt::AlwaysNotify) {
            show_message(
                &app,
                "检查更新",
                "当前已是最新版本。",
                MessageDialogKind::Info,
            );
        }
        return Ok(());
    };

    let notes = update.body.clone().unwrap_or_default();
    let message = if notes.is_empty() {
        format!("发现新版本 {}，是否现在下载并安装？", update.version)
    } else {
        format!(
            "发现新版本 {}。\n\n{}\n\n是否现在下载并安装？",
            update.version, notes
        )
    };

    if !ask_yes_no(&app, "软件更新", &message) {
        return Ok(());
    }

    update
        .download_and_install(|_chunk, _total| {}, || {})
        .await
        .map_err(|e| e.to_string())?;

    app.request_restart();
    #[allow(unreachable_code)]
    Ok(())
}

fn show_message(app: &AppHandle, title: &str, message: &str, kind: MessageDialogKind) {
    app.dialog()
        .message(message)
        .title(title)
        .kind(kind)
        .buttons(MessageDialogButtons::Ok)
        .show(|_| {});
}

fn ask_yes_no(app: &AppHandle, title: &str, message: &str) -> bool {
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .message(message)
        .title(title)
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::YesNo)
        .show(move |confirmed| {
            let _ = tx.send(confirmed);
        });

    rx.recv().unwrap_or(false)
}

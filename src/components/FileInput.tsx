import {createSignal} from "solid-js";
import "./FileInput.css";
import 'mdui/components/button.js';

interface FileInputProps {
    onFileSelect: (file: File, content: string) => Promise<void>;
    accept?: string;
    buttonText?: string;
}

export default function FileInput(props: FileInputProps) {
    const [loading, setLoading] = createSignal(false);
    const [fileName, setFileName] = createSignal<string>("");
    let fileInputRef: HTMLInputElement | undefined;

    const handleButtonClick = () => {
        if (!loading()) {
            fileInputRef?.click();
        }
    };

    const handleFileChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        setFileName(file.name);
        setLoading(true);

        try {
            // 读取文件内容
            const text = await file.text();

            // 调用父组件提供的处理函数
            await props.onFileSelect(file, text);
        } finally {
            setLoading(false);
            // 清空 input，允许重新上传同一文件
            input.value = "";
        }
    };

    return (
        <div class="file-input-container">
            <mdui-button
                prop:variant="filled"
                prop:disabled={loading()}
                prop:loading={loading()}
                onClick={handleButtonClick}
            >
                {loading() ? "处理中..." : (props.buttonText || "选择文件")}
            </mdui-button>

            <input
                ref={fileInputRef!}
                type="file"
                accept={props.accept || "*"}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />

            {fileName() && (
                <div class="file-info">
                    已选择: {fileName()}
                </div>
            )}
        </div>
    );
}
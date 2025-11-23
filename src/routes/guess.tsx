import {Title} from "@solidjs/meta";
import { createSignal } from "solid-js";
import Album from "../components/Album";

export default function Guess() {
  const [showAnswer, setShowAnswer] = createSignal(false);

  return (
    <main>
      <Title>Guess</Title>
      <h1>Epic English Night</h1>
      <div id="song">
        <Album
          src="https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647"
          showAnswer={showAnswer()}
          size={300}
        />
        <button onClick={() => setShowAnswer(!showAnswer())}>
          {showAnswer() ? "Hide Answer" : "Show Answer"}
        </button>
      </div>
      <div id="rank">
        <table id="">

        </table>
      </div>
    </main>
  );
}

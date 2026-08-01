import { SearchScreen } from '../../components/SearchScreen';
import '../../App.css';

export function AddButtonInteraction() {
  return (
    <div className="phone-scroll">
      <SearchScreen
        open={false}
        addButtonVariant="stepper"
        disableExpand
        onExpand={() => {}}
      />
    </div>
  );
}

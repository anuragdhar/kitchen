"""Validate published PNG dimensions, checksums and provenance; not appearance."""
import argparse
from pathlib import Path
from archviz_contract import validate_outputs
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public',type=Path,default=Path(__file__).resolve().parents[1]/'react-configurator/public')
    args = parser.parse_args()
    print(f'ARCHVIZ_OUTPUTS_OK: {validate_outputs(args.public)} images; visual review is still required')

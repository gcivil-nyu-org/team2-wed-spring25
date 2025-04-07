// import { render, screen } from '@testing-library/react';
// import Loader from '@/components/molecules/Loader/Loader'; // Adjust the import path
// import Image from 'next/image';

// jest.mock('next/image', () => ({
//   __esModule: true,
//   default: ({ src, alt, width, height }) => (
//     <img
//       src={src}
//       alt={alt}
//       width={width}
//       height={height}
//       data-testid={`mock-image--${src.replace('/', '-')}`} // Adjusted data-testid generation
//     />
//   ),
// }));

// describe('Loader Component', () => {
//   it('renders the owl logo and loader ellipsis images', () => {
//     render(<Loader />);

//     const owlLogoImage = screen.getByTestId('mock-image--owl-logo.svg');
//     expect(owlLogoImage).toBeInTheDocument();
//     expect(owlLogoImage).toHaveAttribute('src', '/owl-logo.svg');
//     expect(owlLogoImage).toHaveAttribute('alt', 'Loading...');
//     expect(owlLogoImage).toHaveAttribute('width', '40');
//     expect(owlLogoImage).toHaveAttribute('height', '40');

//     const loaderEllipsisImage = screen.getByTestId('mock-image--icons-loader-ellipsis.gif');
//     expect(loaderEllipsisImage).toBeInTheDocument();
//     expect(loaderEllipsisImage).toHaveAttribute('src', '/icons/loader-ellipsis.gif');
//     expect(loaderEllipsisImage).toHaveAttribute('alt', 'Loading...');
//     expect(loaderEllipsisImage).toHaveAttribute('width', '80');
//     expect(loaderEllipsisImage).toHaveAttribute('height', '80');
//   });

//   it('renders within a div with correct classes', () => {
//     render(<Loader />);

//     const loaderDiv = screen.getByRole('generic');
//     expect(loaderDiv).toHaveClass('flex');
//     expect(loaderDiv).toHaveClass('flex-col');
//     expect(loaderDiv).toHaveClass('justify-center');
//     expect(loaderDiv).toHaveClass('items-center');
//     expect(loaderDiv).toHaveClass('py-10');
//   });

//   it('renders the images with correct widths and heights', () => {
//     render(<Loader />);

//     const owlLogoImage = screen.getByTestId('mock-image--owl-logo.svg');
//     const loaderEllipsisImage = screen.getByTestId('mock-image--icons-loader-ellipsis.gif');

//     expect(owlLogoImage).toHaveAttribute('width', '40');
//     expect(owlLogoImage).toHaveAttribute('height', '40');
//     expect(loaderEllipsisImage).toHaveAttribute('width', '80');
//     expect(loaderEllipsisImage).toHaveAttribute('height', '80');
//   });
// });